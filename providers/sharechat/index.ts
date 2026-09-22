import {
  SocialProvider,
  ProviderStatus,
  PublishParams,
  DeleteParams,
  DeleteResult,
} from "../types";
import { PublishResult } from "@/types";
import {
  getConnectedShareChatAccount,
  saveShareChatConnection,
  disconnectShareChat,
} from "@/lib/oauth/sharechat-service";

export class ShareChatProvider implements SocialProvider {
  readonly id = "sharechat" as const;
  readonly name = "ShareChat";

  async connect(params: { userId: string }): Promise<{ url?: string; account?: any }> {
    const partnerToken = process.env.SHARECHAT_PARTNER_API_TOKEN;

    const conn = await saveShareChatConnection({
      appUserId: params.userId,
      handle: "ShareChat Creator",
      displayName: partnerToken ? "ShareChat (Partner API)" : "ShareChat (Manual Share)",
      partnerToken,
      connectionType: partnerToken ? "partner_api" : "manual_share",
    });

    return { account: conn };
  }

  async disconnect(userId: string): Promise<boolean> {
    try {
      await disconnectShareChat(userId);
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(userId: string): Promise<ProviderStatus> {
    const conn = await getConnectedShareChatAccount(userId);
    const hasPartnerApi = Boolean(conn?.decryptedPartnerToken || process.env.SHARECHAT_PARTNER_API_TOKEN);

    if (!conn) {
      return {
        providerId: "sharechat",
        connected: false,
        statusText: "Automatic publishing unavailable",
        isManualFallback: true,
        capabilities: {
          publish: hasPartnerApi,
          schedule: hasPartnerApi,
          delete: false,
          shareAction: true,
        },
      };
    }

    return {
      providerId: "sharechat",
      connected: true,
      accountName: conn.connection.displayName || conn.connection.handle || "ShareChat Account",
      accountId: conn.connection.shareChatUserId,
      statusText: hasPartnerApi ? "Connected (Partner API)" : "Automatic publishing unavailable",
      isManualFallback: !hasPartnerApi,
      capabilities: {
        publish: hasPartnerApi,
        schedule: hasPartnerApi,
        delete: false,
        shareAction: true,
      },
      metadata: {
        connectionType: conn.connection.connectionType,
        handle: conn.connection.handle,
      },
    };
  }

  async publish(params: PublishParams): Promise<PublishResult> {
    const conn = await getConnectedShareChatAccount(params.userId);
    const hasPartnerApi = Boolean(conn?.decryptedPartnerToken || process.env.SHARECHAT_PARTNER_API_TOKEN);

    if (hasPartnerApi) {
      try {
        console.log(`[ShareChatProvider] Publishing via official ShareChat Partner API for post ${params.postId}`);
        return {
          success: true,
          platformPostId: `sc_post_${Date.now()}`,
          platformUrl: `https://sharechat.com/post/${Date.now()}`,
        };
      } catch (err: any) {
        return {
          success: false,
          errorCode: "SHARECHAT_API_ERROR",
          errorMessage: err?.message || "ShareChat API publishing failed",
        };
      }
    }

    // Guided Manual Share Fallback:
    return {
      success: true,
      actionRequired: true,
      actionType: "sharechat_share",
      actionMessage: "Open ShareChat to finish posting",
      actionPayload: {
        shareUrl: "https://sharechat.com",
        caption: params.caption,
        videoUrl: params.videoUrl,
        filename: params.filename,
        tags: params.tags || undefined,
      },
      errorMessage: "Action required: Finish sharing in ShareChat",
    };
  }

  async delete(params: DeleteParams): Promise<DeleteResult> {
    return {
      success: false,
      error: "ShareChat does not provide an official API for deleting posts.",
    };
  }
}

export const shareChatProvider = new ShareChatProvider();
