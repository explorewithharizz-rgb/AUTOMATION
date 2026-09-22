import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    google: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.trim().length > 5,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.trim().length > 5,
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/google/callback`,
    },
    meta: {
      hasAppId: !!process.env.META_APP_ID && process.env.META_APP_ID.trim().length > 5,
      hasAppSecret: !!process.env.META_APP_SECRET && process.env.META_APP_SECRET.trim().length > 5,
      redirectUri:
        process.env.META_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/meta/callback`,
    },
  });
}
