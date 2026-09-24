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
      selectedBorder: "border-red-500 shadow-sm shadow-red-500/10",
      selectedBg: "bg-red-50/80 dark:bg-red-950/25",
      selectedTextColor: "text-red-600 dark:text-red-400",
      connected: isMockMode || connectedYoutube,
    },
    {
      id: "facebook" as Platform,
      name: "Facebook",
      desc: "Page Video & Reels",
      icon: Facebook,
      iconColor: "text-blue-500",
      selectedBorder: "border-blue-500 shadow-sm shadow-blue-500/10",
      selectedBg: "bg-blue-50/80 dark:bg-blue-950/25",
      selectedTextColor: "text-blue-600 dark:text-blue-400",
      connected: isMockMode || connectedMeta,
    },
    {
      id: "instagram" as Platform,
      name: "Instagram",
      desc: "Reels & Feed Video",
      icon: Instagram,
      iconColor: "text-pink-500",
      selectedBorder: "border-pink-500 shadow-sm shadow-pink-500/10",
      selectedBg: "bg-pink-50/80 dark:bg-pink-950/25",
      selectedTextColor: "text-pink-600 dark:text-pink-400",
      connected: isMockMode || connectedMeta,
    },
    {
      id: "snapchat" as Platform,
      name: "Snapchat",
      desc: "Spotlight & Stories",
      icon: Ghost,
      iconColor: "text-amber-500 dark:text-amber-400",
      selectedBorder: "border-amber-500 shadow-sm shadow-amber-500/10",
      selectedBg: "bg-amber-50/80 dark:bg-amber-950/25",
      selectedTextColor: "text-amber-600 dark:text-amber-400",
      connected: isMockMode || connectedSnapchat,
    },
    {
      id: "sharechat" as Platform,
      name: "ShareChat",
      desc: "Videos & Manual Share",
      icon: Share2,
      iconColor: "text-teal-500 dark:text-teal-400",
      selectedBorder: "border-teal-500 shadow-sm shadow-teal-500/10",
      selectedBg: "bg-teal-50/80 dark:bg-teal-950/25",
      selectedTextColor: "text-teal-600 dark:text-teal-400",
      connected: isMockMode || connectedShareChat,
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          Post To Platforms ({selectedPlatforms.length} selected)
        </label>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          Click any platform to toggle
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {platformsList.map((p) => {
          const isSelected = selectedPlatforms.includes(p.id);
          const Icon = p.icon;

          return (
            <div
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={`cursor-pointer rounded-2xl p-3.5 border-2 transition-all select-none flex flex-col justify-between ${
                isSelected
                  ? `${p.selectedBorder} ${p.selectedBg}`
                  : "bg-white dark:bg-[#11131A] border-gray-200 dark:border-[#1E2230] hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#181B26]"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#181B26] border border-gray-200 dark:border-[#272D40] flex items-center justify-center flex-shrink-0 ${p.iconColor} shadow-sm`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`text-xs font-bold leading-tight truncate ${
                        isSelected
                          ? p.selectedTextColor
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {p.name}
                    </h4>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate block mt-0.5">
                      {p.desc}
                    </span>
                  </div>
                </div>

                {/* Checkbox circle */}
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300 dark:border-[#272D40] bg-gray-50 dark:bg-[#141620]"
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#1E2230]/60">
                {p.connected ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected & Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
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
