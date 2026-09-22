import {
  SocialProvider,
  ProviderStatus,
  PublishParams,
  DeleteParams,
  DeleteResult,
} from "../types";
import { PublishResult } from "@/types";
import {
  getConnectedYouTubeAccount,
  disconnectYouTubeAccount,
  getValidYouTubeAccessToken,
} from "@/lib/oauth/youtube-service";
import { publishToYouTube } from "@/lib/platforms/youtube";

export class YouTubeProvider implements SocialProvider {
  readonly id = "youtube" as const;
  readonly name = "YouTube";

  async connect(params: { userId: string }): Promise<{ url?: string; account?: any }> {
    return {
      url: `/api/auth/youtube?user_id=${encodeURIComponent(params.userId)}`,
    };
  }

  async disconnect(userId: string): Promise<boolean> {
    try {
      await disconnectYouTubeAccount(userId);
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(userId: string): Promise<ProviderStatus> {
    const conn = await getConnectedYouTubeAccount(userId);
    if (!conn) {
      return {
        providerId: "youtube",
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

    const channelName = conn.connection.youtubeChannelName || conn.account?.account_name || "YouTube Channel";
    const channelId = conn.connection.youtubeChannelId || conn.account?.youtube_channel_id || conn.account?.account_id;
    const channelThumbnail = conn.connection.channelProfileImage || conn.account?.metadata?.avatar_url || null;

    return {
      providerId: "youtube",
      connected: true,
      accountName: channelName,
      accountId: channelId,
      profileImage: channelThumbnail,
      statusText: "Connected",
      capabilities: {
        publish: true,
        schedule: true,
        delete: true,
        shareAction: false,
      },
      metadata: {
        channelId,
        channelTitle: channelName,
      },
    };
  }

  async publish(params: PublishParams): Promise<PublishResult> {
    return publishToYouTube({
      userId: params.userId,
      videoStoragePath: params.videoStoragePath,
      videoUrl: params.videoUrl,
      filename: params.filename,
      youtubeTitle: params.title || undefined,
      title: params.title || undefined,
      caption: params.caption,
      description: params.description || params.caption,
      tags: params.tags || undefined,
      privacyStatus: params.privacyStatus || "public",
    });
  }

  async delete(params: DeleteParams): Promise<DeleteResult> {
    try {
      const ytToken = await getValidYouTubeAccessToken(params.userId);
      if (!ytToken) {
        return { success: false, error: "YouTube account not connected." };
      }

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${params.platformPostId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${ytToken}` },
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `YouTube API Error: ${errText}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "YouTube deletion failed" };
    }
  }
}

export const youtubeProvider = new YouTubeProvider();
