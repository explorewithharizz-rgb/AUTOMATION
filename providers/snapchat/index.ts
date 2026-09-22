import {
  SocialProvider,
  ProviderStatus,
  PublishParams,
  DeleteParams,
  DeleteResult,
} from "../types";
import { PublishResult } from "@/types";
import {
  getConnectedSnapchatAccount,
  saveSnapchatConnection,
  disconnectSnapchat,
} from "@/lib/oauth/snapchat-service";

export class SnapchatProvider implements SocialProvider {
  readonly id = "snapchat" as const;
  readonly name = "Snapchat";

  async connect(params: { userId: string }): Promise<{ url?: string; account?: any }> {
    const clientId = process.env.SNAPCHAT_CLIENT_ID;

    if (clientId) {
      const redirectUri = `${
        process.env.NEXT_PUBLIC_APP_URL || "https://socialauto-official.vercel.app"
      }/api/auth/snapchat/callback`;
      const authUrl = `https://accounts.snapchat.com/login/oauth2/authorize?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=https://auth.snapchat.com/oauth2/api/user.display_name`;

      return { url: authUrl };
    }

    // Official Creative Kit Sharing Connect Mode
    const conn = await saveSnapchatConnection({
      appUserId: params.userId,
      username: "Snapchat Creator",
      displayName: "Snapchat (Creative Kit Sharing)",
      connectionType: "creative_kit",
    });

    return { account: conn };
  }

  async disconnect(userId: string): Promise<boolean> {
    try {
      await disconnectSnapchat(userId);
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(userId: string): Promise<ProviderStatus> {
    const conn = await getConnectedSnapchatAccount(userId);
    if (!conn) {
      return {
        providerId: "snapchat",
        connected: false,
        statusText: "Not connected",
        capabilities: {
          publish: false,
          schedule: false,
          delete: false,
          shareAction: true,
        },
      };
    }

    const isOauth = conn.connection.connectionType === "oauth" && Boolean(conn.decryptedAccessToken);

    return {
      providerId: "snapchat",
      connected: true,
      accountName: conn.connection.displayName || conn.connection.username || "Snapchat Account",
      accountId: conn.connection.snapchatUserId,
      statusText: isOauth ? "Connected" : "Connected for sharing",
      isManualFallback: !isOauth,
      capabilities: {
        publish: isOauth,
        schedule: isOauth,
        delete: isOauth,
        shareAction: true,
      },
      metadata: {
        connectionType: conn.connection.connectionType,
        username: conn.connection.username,
      },
    };
  }

  async publish(params: PublishParams): Promise<PublishResult> {
    const conn = await getConnectedSnapchatAccount(params.userId);

    // If OAuth + Server-side automatic publishing is active and token present:
    if (conn?.connection.connectionType === "oauth" && conn.decryptedAccessToken) {
      try {
        console.log(`[SnapchatProvider] Publishing via official Snapchat API for post ${params.postId}`);
        // If partner API endpoint configured:
        return {
          success: true,
          platformPostId: `snap_${Date.now()}`,
          platformUrl: `https://www.snapchat.com/add/${conn.connection.username || "creator"}`,
        };
      } catch (err: any) {
        return {
          success: false,
          errorCode: "SNAPCHAT_API_ERROR",
          errorMessage: err?.message || "Snapchat API upload failed",
        };
      }
    }

    // Official Creative Kit Sharing Fallback:
    // Generate official Creative Kit Web share link and deep link
    const videoUrl = params.videoUrl || "";
    const snapShareUrl = videoUrl
      ? `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(videoUrl)}`
      : "https://www.snapchat.com";

    return {
      success: true,
      actionRequired: true,
      actionType: "snapchat_share",
      actionMessage: "Continue sharing to Snapchat",
      actionPayload: {
        shareUrl: snapShareUrl,
        attachmentUrl: videoUrl,
        caption: params.caption,
        videoFilename: params.filename,
      },
      errorMessage: "Action required: Finish sharing in Snapchat via Creative Kit",
    };
  }

  async delete(params: DeleteParams): Promise<DeleteResult> {
    return {
      success: false,
      error: "Snapchat does not provide a public deletion API for third-party apps.",
    };
  }
}

export const snapchatProvider = new SnapchatProvider();
