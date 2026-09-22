import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { googleClientId, googleClientSecret, metaAppId, metaAppSecret } =
      await request.json();

    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    const updateOrAppend = (key: string, value: string) => {
      process.env[key] = value;
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    };

    if (googleClientId !== undefined) {
      updateOrAppend("GOOGLE_CLIENT_ID", googleClientId.trim());
    }
    if (googleClientSecret !== undefined) {
      updateOrAppend("GOOGLE_CLIENT_SECRET", googleClientSecret.trim());
    }
    if (metaAppId !== undefined) {
      updateOrAppend("META_APP_ID", metaAppId.trim());
    }
    if (metaAppSecret !== undefined) {
      updateOrAppend("META_APP_SECRET", metaAppSecret.trim());
    }

    fs.writeFileSync(envPath, envContent.trim() + "\n", "utf8");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save API credentials" },
      { status: 500 }
    );
  }
}
