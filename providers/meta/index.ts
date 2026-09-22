import {
  SocialProvider,
  ProviderStatus,
  PublishParams,
  DeleteParams,
  DeleteResult,
} from "../types";
import { PublishResult } from "@/types";
import {
  getConnectedMetaAccount,
  disconnectMeta,
  META_GRAPH_BASE,
} from "@/lib/oauth/meta-service";
import { publishToFacebook } from "@/lib/platforms/facebook";
import { publishToInstagram } from "@/lib/platforms/instagram";
import { resolveVideoBuffer } from "@/lib/platforms/youtube";

export class MetaProvider implements SocialProvider {
  readonly id = "meta" as const;
  readonly name = "Meta (Facebook & Instagram)";

  async connect(params: { userId: string }): Promise<{ url?: string; account?: any }> {
    return {
      url: `/api/oauth/meta/start?user_id=${encodeURIComponent(params.userId)}`,
    };
  }

  async disconnect(userId: string): Promise<boolean> {
    try {
      await disconnectMeta(userId);
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(userId: string): Promise<ProviderStatus> {
    const metaConn = await getConnectedMetaAccount(userId);
    if (!metaConn) {
      return {
        providerId: "meta",
        connected: false,
        statusText: "Not connected",
        capabilities: {
          publish: true,
          schedule: true,
          delete: true,
          shareAction: false,
        },
      };
    }

    const hasInstagram = Boolean(metaConn.connection.instagramAccountId);

    return {
      providerId: "meta",
      connected: true,
      accountName: metaConn.connection.facebookPageName || "Facebook Page",
      accountId: metaConn.connection.facebookPageId,
      profileImage: metaConn.connection.instagramProfilePicture || null,
      statusText: hasInstagram
        ? `Connected (${metaConn.connection.facebookPageName} + @${metaConn.connection.instagramUsername})`
        : `Connected (${metaConn.connection.facebookPageName})`,
      capabilities: {
        publish: true,
        schedule: true,
        delete: true,
        shareAction: false,
      },
      metadata: {
        facebookPageId: metaConn.connection.facebookPageId,
        facebookPageName: metaConn.connection.facebookPageName,
        instagramAccountId: metaConn.connection.instagramAccountId,
        instagramUsername: metaConn.connection.instagramUsername,
      },
    };
  }

  async publishFacebook(params: PublishParams): Promise<PublishResult> {
    const metaConn = await getConnectedMetaAccount(params.userId);
    if (!metaConn) {
      return {
        success: false,
        errorCode: "META_NOT_CONNECTED",
        errorMessage: "Meta account is not connected. Please connect Facebook in Connected Accounts.",
      };
    }

    const videoRes = resolveVideoBuffer({
      videoStoragePath: params.videoStoragePath,
      filename: params.filename,
    });

    return publishToFacebook({
      pageId: metaConn.connection.facebookPageId,
      accessToken: metaConn.decryptedPageToken,
      caption: params.caption,
      title: params.title || undefined,
      videoBuffer: videoRes?.buffer,
      videoUrl: params.videoUrl,
      filename: params.filename || "video.mp4",
    });
  }

  async publishInstagram(params: PublishParams): Promise<PublishResult> {
    const metaConn = await getConnectedMetaAccount(params.userId);
    if (!metaConn) {
      return {
        success: false,
        errorCode: "META_NOT_CONNECTED",
        errorMessage: "Meta account is not connected. Please connect Instagram in Connected Accounts.",
      };
    }

    if (!metaConn.connection.instagramAccountId) {
      return {
        success: false,
        errorCode: "NO_INSTAGRAM_ACCOUNT",
        errorMessage: "No Instagram Professional account is linked to your connected Facebook Page.",
      };
    }

    const videoRes = resolveVideoBuffer({
      videoStoragePath: params.videoStoragePath,
      filename: params.filename,
    });

    return publishToInstagram({
      instagramAccountId: metaConn.connection.instagramAccountId,
      accessToken: metaConn.decryptedPageToken,
      caption: params.caption,
      videoBuffer: videoRes?.buffer,
      videoUrl: params.videoUrl,
      filename: params.filename || "video.mp4",
      storagePath: params.videoStoragePath,
    });
  }

  async publish(params: PublishParams): Promise<PublishResult> {
    // Default publish routes to Facebook unless called via specific platform adapter
    return this.publishFacebook(params);
  }

  async delete(params: DeleteParams): Promise<DeleteResult> {
    const metaConn = await getConnectedMetaAccount(params.userId);
    if (!metaConn?.decryptedPageToken) {
      return { success: false, error: "Meta account not connected." };
    }

    try {
      const res = await fetch(
        `${META_GRAPH_BASE}/${params.platformPostId}?access_token=${metaConn.decryptedPageToken}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `Facebook API Error: ${errText}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Facebook deletion failed" };
    }
  }
}

export const metaProvider = new MetaProvider();
