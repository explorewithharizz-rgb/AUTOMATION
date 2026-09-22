import { Platform, PublishResult as CorePublishResult } from "@/types";

export interface ProviderCapabilities {
  publish: boolean; // Automatic server-side background publishing
  schedule: boolean;
  delete: boolean; // Official API video deletion
  shareAction: boolean; // Manual share / Creative Kit required
}

export interface ProviderStatus {
  providerId: string;
  connected: boolean;
  accountName?: string | null;
  accountId?: string | null;
  profileImage?: string | null;
  statusText?: string;
  isManualFallback?: boolean;
  capabilities: ProviderCapabilities;
  metadata?: Record<string, any>;
}

export interface PublishParams {
  userId: string;
  postId: string;
  videoStoragePath: string;
  videoUrl?: string;
  filename: string;
  caption: string;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  privacyStatus?: "public" | "unlisted" | "private" | null;
}

export interface DeleteParams {
  userId: string;
  platformPostId: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface SocialProvider {
  readonly id: Platform | "meta";
  readonly name: string;

  connect(params: { userId: string; [key: string]: any }): Promise<{ url?: string; account?: any; error?: string }>;
  disconnect(userId: string): Promise<boolean>;
  getStatus(userId: string): Promise<ProviderStatus>;
  publish(params: PublishParams): Promise<CorePublishResult>;
  delete?(params: DeleteParams): Promise<DeleteResult>;
}
