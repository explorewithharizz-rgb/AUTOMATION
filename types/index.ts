export type Platform =
  | "instagram"
  | "facebook"
  | "youtube"
  | "snapchat"
  | "sharechat";

export type PostMode = "now" | "scheduled";

export type PostStatus =
  | "draft"
  | "queued"
  | "publishing"
  | "completed"
  | "partial"
  | "failed";

export type TargetStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "published"
  | "action_required"
  | "failed";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  provider: "meta" | "youtube" | "snapchat" | "sharechat";
  account_name: string | null;
  account_id: string | null;
  facebook_page_id: string | null;
  instagram_account_id: string | null;
  youtube_channel_id: string | null;
  snapchat_username?: string | null;
  sharechat_handle?: string | null;
  token_expires_at: string | null;
  metadata?: Record<string, any>;
  connected_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  caption: string;
  youtube_title: string | null;
  video_storage_path: string;
  video_filename: string;
  video_size: number;
  video_duration: number | null;
  video_width: number | null;
  video_height: number | null;
  post_mode: PostMode;
  scheduled_at: string | null;
  timezone: string;
  status: PostStatus;
  description?: string | null;
  privacy_status?: "public" | "unlisted" | "private" | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  targets?: PostTarget[];
}

export interface PostTarget {
  id: string;
  post_id: string;
  user_id: string;
  platform: Platform;
  status: TargetStatus;
  platform_post_id: string | null;
  platform_url: string | null;
  error_code: string | null;
  error_message: string | null;
  action_required?: boolean;
  action_type?: string | null;
  action_message?: string | null;
  action_payload?: Record<string, any> | null;
  attempt_count: number;
  started_at: string | null;
  published_at: string | null;
  updated_at: string;
}

export interface VideoMetadata {
  file: File | null;
  filename: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  mimeType: string;
  thumbnailUrl?: string;
  storagePath?: string;
}

export interface PublishResult {
  success: boolean;
  actionRequired?: boolean;
  actionType?: "snapchat_share" | "sharechat_share" | string;
  actionMessage?: string;
  actionPayload?: {
    shareUrl?: string;
    attachmentUrl?: string;
    caption?: string;
    videoUrl?: string;
    tags?: string[];
    [key: string]: any;
  };
  platformPostId?: string;
  platformUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  isProcessing?: boolean;
  processingMessage?: string;
  devDetails?: {
    status?: number;
    code?: number;
    reason?: string;
    exactGoogleReason?: string;
    message?: string;
    detailMessage?: string;
    raw?: any;
    channelId?: string;
    channelName?: string;
    insertCallsCount?: number;
    [key: string]: any;
  };
}
