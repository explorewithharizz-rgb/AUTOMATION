"use client";

import { Instagram, Facebook, Youtube, Ghost, Share2, Film } from "lucide-react";
import { Platform } from "@/types";

interface VideoPreviewProps {
  thumbnailUrl?: string;
  caption: string;
  selectedPlatforms: Platform[];
}

export function VideoPreview({
  thumbnailUrl,
  caption,
  selectedPlatforms,
}: VideoPreviewProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Phone Mockup Frame */}
      <div className="w-[280px] sm:w-[300px] h-[520px] rounded-[40px] border-4 border-[#272D40] bg-[#000000] p-3 shadow-2xl relative flex flex-col overflow-hidden">
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#1E2230] rounded-full z-20" />

        {/* Screen Area */}
        <div className="w-full h-full rounded-[28px] bg-[#0E1017] overflow-hidden relative flex flex-col justify-between">
          {/* Media Content */}
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Video preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-gradient-to-b from-[#151824] to-[#0A0C13]">
              <Film className="w-12 h-12 mb-2 stroke-[1.5]" />
              <span className="text-xs font-medium text-gray-500">
                Video Preview
              </span>
            </div>
          )}

          {/* Top Mock Social Bar */}
          <div className="relative z-10 p-3 pt-6 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/90 drop-shadow">
              Reels / Shorts
            </span>
          </div>

          {/* Bottom Overlay (Caption & Creator info) */}
          <div className="relative z-10 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow">
                P
              </div>
              <span className="text-xs font-semibold text-white drop-shadow">
                @yourchannel
              </span>
            </div>

            <p className="text-xs text-white/95 line-clamp-3 leading-snug drop-shadow">
              {caption || "Write a caption to see preview here..."}
            </p>
          </div>
        </div>
      </div>

      {/* Target Platforms Indicator Below Preview */}
      <div className="mt-5 text-center w-full">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
          Your video will be posted to:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Instagram */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
              selectedPlatforms.includes("instagram")
                ? "bg-pink-50 text-pink-700 border-pink-300 dark:bg-pink-500/15 dark:border-pink-500/30 dark:text-pink-400 shadow-sm"
                : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-[#141722] dark:border-[#1E2230] dark:text-gray-600 opacity-40"
            }`}
          >
            <Instagram className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
            <span>Instagram</span>
          </div>

          {/* Facebook */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
              selectedPlatforms.includes("facebook")
                ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-400 shadow-sm"
                : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-[#141722] dark:border-[#1E2230] dark:text-gray-600 opacity-40"
            }`}
          >
            <Facebook className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Facebook</span>
          </div>

          {/* YouTube */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
              selectedPlatforms.includes("youtube")
                ? "bg-red-50 text-red-700 border-red-300 dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-400 shadow-sm"
                : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-[#141722] dark:border-[#1E2230] dark:text-gray-600 opacity-40"
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>YouTube</span>
          </div>

          {/* Snapchat */}
          {selectedPlatforms.includes("snapchat") && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400 shadow-sm">
              <Ghost className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Snapchat</span>
            </div>
          )}

          {/* ShareChat */}
          {selectedPlatforms.includes("sharechat") && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-500/15 dark:border-teal-500/30 dark:text-teal-400 shadow-sm">
              <Share2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>ShareChat</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
