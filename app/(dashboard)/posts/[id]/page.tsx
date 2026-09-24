"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Post, PostTarget, Platform } from "@/types";
import { PostStatusBadge, TargetStatusItem } from "@/components/PostStatusBadge";
import { formatInTimezone } from "@/lib/utils/timezone";
import {
  ArrowLeft,
  Calendar,
  Film,
  RefreshCw,
  Trash2,
  Share2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingPlatform, setRetryingPlatform] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => {
        if (data.accounts) setAccounts(data.accounts);
      })
      .catch(() => {});
  }, []);

  const fetchPostDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}?t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.post) {
        setPost(data.post);
      } else {
        setError(data.error || "Post not found");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostDetails();

    // Auto-poll if post is in flight
    const interval = setInterval(() => {
      if (
        post?.status === "queued" ||
        post?.status === "publishing" ||
        post?.targets?.some((t) => t.status === "uploading" || t.status === "processing")
      ) {
        fetchPostDetails();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchPostDetails, post?.status, post?.targets]);

  const handleRetry = async (platform: Platform) => {
    setRetryingPlatform(platform);
    try {
      const res = await fetch(`/api/posts/${postId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to initiate retry.");
      } else {
        await fetchPostDetails();
      }
    } catch (err: any) {
      alert(err?.message || "Retry failed");
    } finally {
      setRetryingPlatform(null);
    }
  };
  
  const [deletingTargetId, setDeletingTargetId] = useState<string | null>(null);

  const handleDeleteTarget = async (targetId: string, platform: string) => {
    if (!confirm(`Are you sure you want to permanently delete this ${platform} post from the platform and the dashboard?`)) return;
    
    setDeletingTargetId(targetId);
    
    // Optimistic UI update - instantly remove it from the screen!
    setPost((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        targets: prev.targets?.filter(t => t.id !== targetId)
      };
    });

    try {
      const res = await fetch(`/api/posts/${postId}/targets/${targetId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to delete target.");
        await fetchPostDetails(); // Revert on failure
      } else {
        await fetchPostDetails();
      }
    } catch (err: any) {
      alert(err?.message || "Delete failed");
      await fetchPostDetails(); // Revert on failure
    } finally {
      setDeletingTargetId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post from your dashboard?")) return;
    
    const deleteFromPlatforms = confirm(
      "Do you ALSO want to permanently delete this video from connected social platforms (Instagram, Facebook, and YouTube)?\n\nClick OK to delete from Instagram, Facebook & YouTube, or Cancel to only delete from the dashboard."
    );

    try {
      const res = await fetch(`/api/posts/${postId}?deletePlatforms=${deleteFromPlatforms}`, { method: "DELETE" });
      if (res.ok) {
        router.push(`/posts?deleted=true&platforms=${deleteFromPlatforms}`);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete post.");
      }
    } catch {
      alert("Failed to delete post.");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500 text-sm">
        Loading publishing status...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-white">Post Not Found</h2>
        <p className="text-xs text-gray-400">{error || "Unable to find post details."}</p>
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Posts</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all posts</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPostDetails}
            title="Refresh status"
            className="p-2 rounded-lg bg-[#11131A] border border-[#1E2230] text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            title="Delete post"
            className="p-2 rounded-lg bg-[#11131A] border border-[#1E2230] text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Status Header Card */}
      <div className="glass-card rounded-2xl p-6 border border-[#1E2230] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Publishing Overview
              </h1>
              <PostStatusBadge status={post.status} />
            </div>
            <p className="text-xs text-gray-400">
              {post.post_mode === "scheduled" && post.scheduled_at
                ? `Scheduled for ${formatInTimezone(post.scheduled_at, post.timezone)}`
                : `Created on ${formatInTimezone(post.created_at, post.timezone)}`}
            </p>
          </div>
        </div>

        {/* Video & Caption Summary */}
        <div className="p-4 rounded-xl bg-[#181B26] border border-[#272D40] space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Film className="w-4 h-4 text-indigo-400" />
            <span className="text-white font-medium">{post.video_filename}</span>
            <span>•</span>
            <span>{(post.video_size / (1024 * 1024)).toFixed(1)} MB</span>
            {post.video_duration && <span>• {post.video_duration}s</span>}
          </div>

          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Caption
            </span>
            <p className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">
              {post.caption}
            </p>
          </div>

          {post.youtube_title && (
            <div className="pt-2 border-t border-[#272D40]">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                YouTube Title
              </span>
              <p className="text-xs text-indigo-300 font-medium">
                {post.youtube_title}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Individual Platform Targets Status */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Individual Platform Status
        </h2>

        {post.targets && post.targets.length > 0 ? (
          <div className="space-y-3">
            {post.targets.map((target) => {
              const ytAccount = accounts.find((a: any) => a.provider === "youtube");
              return (
                <TargetStatusItem
                  key={target.id}
                  platform={target.platform}
                  status={target.status}
                  platformPostId={target.platform_post_id}
                  platformUrl={target.platform_url}
                  actionRequired={target.action_required || target.status === "action_required"}
                  actionType={target.action_type}
                  actionMessage={target.action_message}
                  actionPayload={target.action_payload || {
                    caption: post.caption,
                    videoFilename: post.video_filename,
                    attachmentUrl: post.video_storage_path,
                  }}
                  channelName={target.platform === "youtube" ? ytAccount?.account_name || "Nammaaweb" : null}
                  channelProfileImage={target.platform === "youtube" ? ytAccount?.metadata?.avatar_url : null}
                  errorMessage={target.error_message}
                  onRetry={() => handleRetry(target.platform)}
                  isRetrying={retryingPlatform === target.platform}
                  onDelete={() => handleDeleteTarget(target.id, target.platform)}
                  isDeleting={deletingTargetId === target.id}
                />
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#11131A] text-center text-xs text-gray-500 border border-[#1E2230]">
            No platform targets found for this post.
          </div>
        )}
      </div>
    </div>
  );
}
