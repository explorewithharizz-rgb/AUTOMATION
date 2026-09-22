"use client";

import { Instagram, Facebook, Youtube, Film } from "lucide-react";
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
      <div className="mt-5 text-center">
        <p className="text-xs font-medium text-gray-400 mb-2">
          Your video will be posted to:
        </p>
        <div className="flex items-center justify-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all ${
              selectedPlatforms.includes("instagram")
                ? "bg-pink-500/10 border-pink-500/30 text-pink-400"
                : "bg-[#141722] border-[#1E2230] text-gray-600 opacity-40"
            }`}
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all ${
              selectedPlatforms.includes("facebook")
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : "bg-[#141722] border-[#1E2230] text-gray-600 opacity-40"
            }`}
          >
            <Facebook className="w-3.5 h-3.5" />
            <span>Facebook</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all ${
              selectedPlatforms.includes("youtube")
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-[#141722] border-[#1E2230] text-gray-600 opacity-40"
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube</span>
          </div>
        </div>
      </div>
    </div>
  );
}
