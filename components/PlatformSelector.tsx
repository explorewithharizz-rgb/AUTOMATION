"use client";

import { Instagram, Facebook, Youtube, Ghost, Share2, Check, AlertCircle } from "lucide-react";
import { Platform } from "@/types";

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onChange: (platforms: Platform[]) => void;
  connectedMeta: boolean;
  connectedYoutube: boolean;
  connectedSnapchat?: boolean;
  connectedShareChat?: boolean;
  isMockMode?: boolean;
}

export function PlatformSelector({
  selectedPlatforms,
  onChange,
  connectedMeta,
  connectedYoutube,
  connectedSnapchat = false,
  connectedShareChat = true,
  isMockMode = false,
}: PlatformSelectorProps) {
  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      // Don't allow deselecting all if this is the last one
      if (selectedPlatforms.length > 1) {
        onChange(selectedPlatforms.filter((p) => p !== platform));
      }
    } else {
      onChange([...selectedPlatforms, platform]);
    }
  };

  const platformsList = [
    {
      id: "youtube" as Platform,
      name: "YouTube",
      desc: "Video & Shorts",
      icon: Youtube,
      iconColor: "text-red-500",
      bgSelected: "border-red-500/40 bg-red-500/5",
      connected: isMockMode || connectedYoutube,
    },
    {
      id: "facebook" as Platform,
      name: "Facebook",
      desc: "Page Video & Reels",
      icon: Facebook,
      iconColor: "text-blue-500",
      bgSelected: "border-blue-500/40 bg-blue-500/5",
      connected: isMockMode || connectedMeta,
    },
    {
      id: "instagram" as Platform,
      name: "Instagram",
      desc: "Reels & Feed Video",
      icon: Instagram,
      iconColor: "text-pink-500",
      bgSelected: "border-pink-500/40 bg-pink-500/5",
      connected: isMockMode || connectedMeta,
    },
    {
      id: "snapchat" as Platform,
      name: "Snapchat",
      desc: "Spotlight & Stories",
      icon: Ghost,
      iconColor: "text-amber-400",
      bgSelected: "border-amber-400/40 bg-amber-400/5",
      connected: isMockMode || connectedSnapchat,
    },
    {
      id: "sharechat" as Platform,
      name: "ShareChat",
      desc: "Videos & Manual Share",
      icon: Share2,
      iconColor: "text-teal-400",
      bgSelected: "border-teal-400/40 bg-teal-400/5",
      connected: isMockMode || connectedShareChat,
    },
  ];

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Post To ({selectedPlatforms.length} selected)
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {platformsList.map((p) => {
          const isSelected = selectedPlatforms.includes(p.id);
          const Icon = p.icon;

          return (
            <div
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={`cursor-pointer rounded-2xl p-3.5 border transition-all select-none flex flex-col justify-between ${
                isSelected
                  ? `${p.bgSelected} shadow-md`
                  : "bg-[#11131A] border-[#1E2230] opacity-60 hover:opacity-100 hover:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg bg-[#181B26] border border-[#272D40] flex items-center justify-center flex-shrink-0 ${p.iconColor}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white leading-tight truncate">
                      {p.name}
                    </h4>
                    <span className="text-[10px] text-gray-400 truncate block">
                      {p.desc}
                    </span>
                  </div>
                </div>

                {/* Checkbox circle */}
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-500"
                      : "border-[#272D40] bg-[#141620]"
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
              </div>

              <div className="mt-1">
                {p.connected ? (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5" />
                    Not connected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
