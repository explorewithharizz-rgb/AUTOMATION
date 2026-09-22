"use client";

import { PostStatus, TargetStatus, Platform } from "@/types";
import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
  Instagram,
  Facebook,
  Youtube,
  Ghost,
  Share2,
  RefreshCw,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

export function PostStatusBadge({ status }: { status: PostStatus }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Published</span>
        </span>
      );
    case "partial":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Action Required / Partial</span>
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed</span>
        </span>
      );
    case "publishing":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Publishing</span>
        </span>
      );
    case "queued":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 border border-gray-500/30 text-gray-300">
          <Clock className="w-3.5 h-3.5" />
          <span>Queued</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-400">
          {status}
        </span>
      );
  }
}

interface TargetItemProps {
  platform: Platform;
  status: TargetStatus;
  platformPostId?: string | null;
  platformUrl?: string | null;
  actionRequired?: boolean;
  actionType?: string | null;
  actionMessage?: string | null;
  actionPayload?: any;
  channelName?: string | null;
  channelProfileImage?: string | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function TargetStatusItem({
  platform,
  status,
  platformPostId,
  platformUrl,
  actionRequired,
  actionType,
  actionMessage,
  actionPayload,
  channelName,
  channelProfileImage,
  errorMessage,
  onRetry,
  isRetrying = false,
  onDelete,
  isDeleting = false,
}: TargetItemProps) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const getIcon = () => {
    switch (platform) {
      case "instagram":
        return <Instagram className="w-4 h-4 text-pink-400" />;
      case "facebook":
        return <Facebook className="w-4 h-4 text-blue-400" />;
      case "youtube":
        return <Youtube className="w-4 h-4 text-red-400" />;
      case "snapchat":
        return <Ghost className="w-4 h-4 text-yellow-400" />;
      case "sharechat":
        return <Share2 className="w-4 h-4 text-teal-400" />;
    }
  };

  const getStatusDisplay = () => {
    if (status === "action_required" || actionRequired) {
      return (
        <span className="flex items-center gap-1 text-xs text-amber-300 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {platform === "snapchat"
              ? "Action required: Finish sharing in Snapchat"
              : platform === "sharechat"
              ? "Action required: Finish sharing in ShareChat"
              : actionMessage || "Action required: Finish sharing"}
          </span>
        </span>
      );
    }

    switch (status) {
      case "published":
        return (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {platform === "youtube"
                ? "Published to YouTube"
                : platform === "snapchat"
                ? "Published to Snapchat"
                : platform === "sharechat"
                ? "Published to ShareChat"
                : "Published"}
            </span>
          </span>
        );
      case "uploading":
      case "processing":
        return (
          <span className="flex items-center gap-1 text-xs text-indigo-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {status === "uploading" ? "Uploading..." : "Processing..."}
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case "queued":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            Queued
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            {status}
          </span>
        );
    }
  };

  const ytVideoId =
    platform === "youtube"
      ? platformPostId || (platformUrl?.includes("v=") ? platformUrl.split("v=")[1]?.split("&")[0] : null)
      : null;

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <>
      <div className="p-3.5 rounded-xl bg-[#181B26] border border-[#272D40] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#11131A] border border-[#2A3045] flex items-center justify-center flex-shrink-0">
            {channelProfileImage && platform === "youtube" ? (
              <img
                src={channelProfileImage}
                alt="Channel"
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              getIcon()
            )}
          </div>
          <div>
            <h5 className="text-xs font-semibold text-white capitalize">
              {platform}
            </h5>
            <div className="mt-0.5">{getStatusDisplay()}</div>
            {status === "published" && platform === "youtube" && channelName && (
              <div className="mt-1 text-[11px] text-gray-300">
                Channel: <span className="font-semibold text-white">{channelName}</span>
              </div>
            )}
            {status === "published" && ytVideoId && (
              <div className="mt-0.5 text-[11px] font-mono text-gray-400">
                Video ID: <span className="font-bold text-emerald-400">{ytVideoId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
          {/* Snapchat Action Button */}
          {platform === "snapchat" && (status === "action_required" || actionRequired) && (
            <a
              href={
                actionPayload?.shareUrl ||
                `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(actionPayload?.attachmentUrl || "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-xs font-semibold text-yellow-300 transition-colors shadow-sm"
            >
              <Ghost className="w-3.5 h-3.5" />
              <span>Continue sharing to Snapchat</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* ShareChat Action Button */}
          {platform === "sharechat" && (status === "action_required" || actionRequired) && (
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-semibold text-teal-300 transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Open ShareChat to finish posting</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {platformUrl && (
            <a
              href={platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#11131A] hover:bg-[#1E2230] border border-[#272D40] text-xs font-medium text-indigo-300 hover:text-white transition-colors"
            >
              <span>{platform === "youtube" ? "Open on YouTube" : "View Post"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {status === "failed" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
              <span>Retry</span>
            </button>
          )}

          {onDelete && status === "published" && platform !== "instagram" && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              title="Delete this post from the platform"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#11131A] hover:bg-red-500/20 border border-[#272D40] hover:border-red-500/30 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="w-full mt-1 text-[11px] text-gray-300 bg-[#141722] p-2 rounded border border-[#272D40]">
            {errorMessage}
          </div>
        )}
      </div>

      {/* ShareChat Manual Sharing Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141724] border border-[#272D40] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  Finish Sharing to ShareChat
                </h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Because ShareChat does not support open automated publishing for third-party apps, follow these 2 quick steps:
            </p>

            <div className="space-y-3">
              {/* Copy Caption */}
              <div className="p-3 bg-[#181B26] border border-[#272D40] rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 block font-semibold uppercase">Step 1: Copy Caption</span>
                  <p className="text-xs text-gray-200 truncate mt-0.5">
                    {actionPayload?.caption || "Video Caption"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCaption(actionPayload?.caption || "")}
                  className="px-3 py-1.5 bg-[#202534] hover:bg-[#282E42] text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 flex-shrink-0"
                >
                  {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCaption ? "Copied!" : "Copy Caption"}</span>
                </button>
              </div>

              {/* Copy / Access Video */}
              {actionPayload?.videoUrl && (
                <div className="p-3 bg-[#181B26] border border-[#272D40] rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 block font-semibold uppercase">Step 2: Video Asset</span>
                    <p className="text-xs text-gray-200 truncate mt-0.5">
                      {actionPayload?.videoFilename || "Video ready for upload"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(actionPayload?.videoUrl || "")}
                    className="px-3 py-1.5 bg-[#202534] hover:bg-[#282E42] text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 flex-shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#1E2230]">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
              >
                Close
              </button>
              <a
                href="https://sharechat.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
              >
                <span>Open ShareChat</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
