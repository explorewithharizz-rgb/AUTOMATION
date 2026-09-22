"use client";

import { Loader2, Send, Calendar } from "lucide-react";
import { PostMode } from "@/types";

interface PublishButtonProps {
  postMode: PostMode;
  isSubmitting: boolean;
  isUploading: boolean;
  disabled: boolean;
  selectedPlatformCount: number;
  onClick: () => void;
}

export function PublishButton({
  postMode,
  isSubmitting,
  isUploading,
  disabled,
  selectedPlatformCount,
  onClick,
}: PublishButtonProps) {
  const isPending = isSubmitting || isUploading;

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isPending}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99]"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>
              {isUploading ? "Uploading Video to Storage..." : "Queuing Publication..."}
            </span>
          </>
        ) : postMode === "now" ? (
          <>
            <Send className="w-5 h-5" />
            <span>
              Post to {selectedPlatformCount} Platform{selectedPlatformCount > 1 ? "s" : ""}
            </span>
          </>
        ) : (
          <>
            <Calendar className="w-5 h-5" />
            <span>Schedule Post</span>
          </>
        )}
      </button>
    </div>
  );
}
