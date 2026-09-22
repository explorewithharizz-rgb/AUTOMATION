import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; targetId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId, targetId } = params;
    const adminSupabase = createAdminClient();

    // 1. Fetch the specific target
    const { data: target, error: targetErr } = await adminSupabase
      .from("post_targets")
      .select("*")
      .eq("id", targetId)
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    if (targetErr || !target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    // 2. Delete from platform if published
    if (target.status === "published" && target.platform_post_id) {
      if (target.platform === "facebook") {
        const { getConnectedMetaAccount } = require("@/lib/oauth/meta-service");
        const metaConn = await getConnectedMetaAccount(user.id);
        if (metaConn?.decryptedPageToken) {
          const res = await fetch(`https://graph.facebook.com/v21.0/${target.platform_post_id}?access_token=${metaConn.decryptedPageToken}`, {
            method: "DELETE"
          });
          if (!res.ok) {
            const errText = await res.text();
            return NextResponse.json({ error: `Facebook API Error: ${errText}` }, { status: 400 });
          }
        }
      } else if (target.platform === "youtube") {
        const { getValidYouTubeAccessToken } = require("@/lib/oauth/youtube-service");
        const ytToken = await getValidYouTubeAccessToken(user.id);
        if (ytToken) {
          const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${target.platform_post_id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${ytToken}` }
          });
          if (!res.ok) {
            const errText = await res.text();
            return NextResponse.json({ error: `YouTube API Error: ${errText}` }, { status: 400 });
          }
        }
      } else if (target.platform === "instagram") {
        // Meta Graph API intentionally does not provide a media delete endpoint.
        // Proceed to remove the target from PostFlow database.
        console.log("[Target Delete] Meta Graph API does not support deleting Instagram media directly. Removing target from PostFlow.");
      }
    }

    // 3. Delete from our database
    const { error: deleteErr } = await adminSupabase
      .from("post_targets")
      .delete()
      .eq("id", targetId);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete target" }, { status: 500 });
  }
}
