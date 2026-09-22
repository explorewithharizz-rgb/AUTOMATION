"use client";

import { useState } from "react";
import {
  Instagram,
  Facebook,
  Youtube,
  Ghost,
  Share2,
  CheckCircle2,
  Trash2,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  Info,
} from "lucide-react";
import { SocialAccount } from "@/types";

export type DisplayPlatform = "youtube" | "facebook" | "instagram" | "snapchat" | "sharechat";

interface SocialAccountCardProps {
  platform: DisplayPlatform;
  account?: SocialAccount;
  onDisconnect: (platform: DisplayPlatform) => Promise<void>;
  onConnect?: (platform: DisplayPlatform) => void;
  isMockMode?: boolean;
}

export function SocialAccountCard({
  platform,
  account,
  onDisconnect,
}: SocialAccountCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const isConnected = !!account;

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${getPlatformLabel(platform)}?`)) {
      return;
    }
    setDisconnecting(true);
    try {
      await onDisconnect(platform);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnectShareChat = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/sharechat/connect", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setConnecting(false);
    }
  };

  function getPlatformLabel(p: DisplayPlatform): string {
    switch (p) {
      case "youtube": return "YouTube";
      case "facebook": return "Facebook";
      case "instagram": return "Instagram";
      case "snapchat": return "Snapchat";
      case "sharechat": return "ShareChat";
    }
  }

  /* ----------------------------------------------------
   * 1. YOUTUBE
   * ---------------------------------------------------- */
  if (platform === "youtube") {
    const channelTitle = account?.account_name || account?.metadata?.channel_title || "YouTube Channel";
    const channelId = account?.youtube_channel_id || account?.account_id;
    const channelThumbnail = account?.metadata?.thumbnail_url;

    return (
      <div className="glass-card rounded-2xl p-6 border border-[#1E2230] space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181B26] border border-[#272D40] flex items-center justify-center text-red-500">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">YouTube</h3>
              <p className="text-xs text-gray-400">Official YouTube Data API v3</p>
            </div>
          </div>

          <div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 border border-gray-500/20 text-gray-400">
                Not Connected
              </span>
            )}
          </div>
        </div>

        {isConnected ? (
          <div className="p-4 rounded-xl bg-[#181B26] border border-[#272D40] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Channel:</span>
              <div className="flex items-center gap-2">
                {channelThumbnail && (
                  <img src={channelThumbnail} alt={channelTitle} className="w-5 h-5 rounded-full" />
                )}
                <span className="text-white font-semibold">{channelTitle}</span>
              </div>
            </div>
            {channelId && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">Channel ID:</span>
                <span className="text-gray-300 font-mono text-[11px]">{channelId}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            Authorize your Google account to automatically publish videos and Shorts to your channel.
          </p>
        )}

        <div className="flex justify-end pt-2 border-t border-[#1E2230]">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-3.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          ) : (
            <a
              href="/api/auth/youtube"
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-red-500/20"
            >
              <Youtube className="w-4 h-4" />
              <span>Connect YouTube</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 2. FACEBOOK
   * ---------------------------------------------------- */
  if (platform === "facebook") {
    const pageName = account?.metadata?.page_name || account?.account_name || "Facebook Page";
    const pageId = account?.facebook_page_id;
    const hasPage = Boolean(pageId);

    return (
      <div className="glass-card rounded-2xl p-6 border border-[#1E2230] space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181B26] border border-[#272D40] flex items-center justify-center text-blue-500">
              <Facebook className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Facebook</h3>
              <p className="text-xs text-gray-400">Official Meta Graph API v21.0</p>
            </div>
          </div>

          <div>
            {hasPage ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 border border-gray-500/20 text-gray-400">
                Not Connected
              </span>
            )}
          </div>
        </div>

        {hasPage ? (
          <div className="p-4 rounded-xl bg-[#181B26] border border-[#272D40] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Facebook Page:</span>
              <span className="text-white font-semibold">{pageName}</span>
            </div>
            {pageId && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">Page ID:</span>
                <span className="text-gray-300 font-mono text-[11px]">{pageId}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            Connect your Facebook Page via official Meta OAuth to schedule and publish videos directly.
          </p>
        )}

        <div className="flex justify-end pt-2 border-t border-[#1E2230]">
          {hasPage ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-3.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          ) : (
            <a
              href="/api/oauth/meta/start"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-500/20"
            >
              <Facebook className="w-4 h-4" />
              <span>Connect Facebook</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 3. INSTAGRAM
   * ---------------------------------------------------- */
  if (platform === "instagram") {
    const igUsername = account?.metadata?.instagram_username;
    const igId = account?.instagram_account_id;
    const hasInstagram = Boolean(igId && igUsername);

    return (
      <div className="glass-card rounded-2xl p-6 border border-[#1E2230] space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181B26] border border-[#272D40] flex items-center justify-center text-pink-500">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Instagram</h3>
              <p className="text-xs text-gray-400">Official Instagram Reels via Meta Graph</p>
            </div>
          </div>

          <div>
            {hasInstagram ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 border border-gray-500/20 text-gray-400">
                Not Connected
              </span>
            )}
          </div>
        </div>

        {hasInstagram ? (
          <div className="p-4 rounded-xl bg-[#181B26] border border-[#272D40] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Professional Account:</span>
              <span className="text-pink-400 font-semibold">@{igUsername}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Instagram ID:</span>
              <span className="text-gray-300 font-mono text-[11px]">{igId}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            Connect an Instagram Professional (Creator/Business) account linked to your Facebook Page for automatic Reels publishing.
          </p>
        )}

        <div className="flex justify-end pt-2 border-t border-[#1E2230]">
          {hasInstagram ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-3.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          ) : (
            <a
              href="/api/oauth/meta/start"
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-opacity shadow-lg shadow-pink-500/20"
            >
              <Instagram className="w-4 h-4" />
              <span>Connect Instagram</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 4. SNAPCHAT
   * ---------------------------------------------------- */
  if (platform === "snapchat") {
    const isSharing = isConnected && account?.metadata?.connection_type === "creative_kit";
    const isOauth = isConnected && account?.metadata?.connection_type === "oauth";

    return (
      <div className="glass-card rounded-2xl p-6 border border-[#1E2230] space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFC00]/10 border border-[#FFFC00]/30 flex items-center justify-center text-[#FFFC00]">
              <Ghost className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Snapchat</h3>
              <p className="text-xs text-gray-400">Official Snap Kit & Creative Kit</p>
            </div>
          </div>

          <div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isOauth ? "Connected" : "Connected for sharing"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 border border-gray-500/20 text-gray-400">
                Not Connected
              </span>
            )}
          </div>
        </div>

        {isConnected ? (
          <div className="p-4 rounded-xl bg-[#181B26] border border-[#272D40] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Integration Mode:</span>
              <span className="text-amber-300 font-semibold">
                {isOauth ? "Official Snap Partner API" : "Creative Kit Web Sharing"}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              When publishing, your video is formatted for vertical 9:16 viewing with one-click Creative Kit sharing to your Snapchat story or Spotlight.
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            Connect Snapchat for official Creative Kit web sharing and direct Spotlight publishing.
          </p>
        )}

        <div className="flex justify-end pt-2 border-t border-[#1E2230]">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-3.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          ) : (
            <a
              href="/api/auth/snapchat"
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-yellow-500/20"
            >
              <Ghost className="w-4 h-4" />
              <span>Connect Snapchat</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
   * 5. SHARECHAT
   * ---------------------------------------------------- */
  return (
    <div className="glass-card rounded-2xl p-6 border border-[#1E2230] space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">ShareChat</h3>
            <p className="text-xs text-gray-400">Official Intent & Partner Adapter</p>
          </div>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <AlertCircle className="w-3.5 h-3.5" />
            Automatic publishing unavailable
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#181B26] border border-[#272D40] space-y-2">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="text-gray-300 font-medium">
              ShareChat does not offer a public automated publishing API for individual creators.
            </p>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Our ShareChat provider adapter is ready for partner API credentials. For standard creators, select ShareChat in the Unified Publisher to access the guided one-click manual share flow (copy caption, video, and open ShareChat).
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-[#1E2230]">
        <span className="text-[11px] text-gray-500 italic">No passwords or browser scraping used</span>
        {isConnected ? (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="px-3.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {disconnecting ? "Resetting..." : "Reset"}
          </button>
        ) : (
          <button
            onClick={handleConnectShareChat}
            disabled={connecting}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>{connecting ? "Connecting..." : "Connect"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
