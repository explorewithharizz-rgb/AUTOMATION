"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SocialAccountCard } from "@/components/SocialAccountCard";
import { SocialAccount } from "@/types";
import { Layers, CheckCircle2, AlertCircle, RefreshCw, Instagram, Facebook } from "lucide-react";

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Multi-page selection state
  const [pendingPages, setPendingPages] = useState<any[]>([]);
  const [selectingPage, setSelectingPage] = useState(false);
  const [pageSubmitting, setPageSubmitting] = useState(false);

  const isMockMode = process.env.NEXT_PUBLIC_SOCIAL_API_MOCK_MODE === "true";

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.accounts) {
        setAccounts(data.accounts);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Check URL query parameters for OAuth results
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");
    const selectPageParam = searchParams.get("select_page");

    if (successParam === "meta_connected") {
      setNotification({
        type: "success",
        message: "Meta (Instagram & Facebook Page) successfully connected!",
      });
    } else if (successParam === "youtube_connected") {
      setNotification({
        type: "success",
        message: "YouTube channel successfully connected!",
      });
    } else if (successParam === "snapchat_connected") {
      setNotification({
        type: "success",
        message: "Snapchat successfully connected!",
      });
    } else if (successParam === "sharechat_connected") {
      setNotification({
        type: "success",
        message: "ShareChat configured successfully!",
      });
    } else if (errorParam) {
      setNotification({
        type: "error",
        message: decodeURIComponent(errorParam),
      });
    }

    // Trigger multi-page selection modal if user manages multiple Facebook Pages
    if (selectPageParam === "true") {
      fetch("/api/meta/pages")
        .then((res) => res.json())
        .then((data) => {
          if (data.pages && data.pages.length > 0) {
            setPendingPages(data.pages);
            setSelectingPage(true);
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  const handleSelectPage = async (pageId: string) => {
    setPageSubmitting(true);
    try {
      const res = await fetch("/api/meta/select-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to select Facebook Page");
      }
      setSelectingPage(false);
      setPendingPages([]);
      await fetchAccounts();
      setNotification({
        type: "success",
        message: `Connected Facebook Page "${data.pageName}"${
          data.instagramUsername ? ` and @${data.instagramUsername}` : ""
        }!`,
      });
      window.history.replaceState({}, "", "/connected-accounts");
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err?.message || "Failed to select Facebook Page",
      });
    } finally {
      setPageSubmitting(false);
    }
  };

  const handleDisconnect = async (platform: any) => {
    const provider = platform === "facebook" || platform === "instagram" ? "meta" : platform;

    const res = await fetch("/api/accounts/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });

    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.provider !== provider));
      setNotification({
        type: "success",
        message: `${platform.toUpperCase()} disconnected successfully.`,
      });
    } else {
      const err = await res.json();
      setNotification({
        type: "error",
        message: err.error || "Failed to disconnect account.",
      });
    }
  };

  const youtubeAccount = accounts.find((a) => a.provider === "youtube");
  const facebookAccount = accounts.find((a) => a.provider === "meta" && a.facebook_page_id);
  const instagramAccount = accounts.find((a) => a.provider === "meta" && a.instagram_account_id);
  const snapchatAccount = accounts.find((a) => a.provider === "snapchat");
  const sharechatAccount = accounts.find((a) => a.provider === "sharechat");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Connected Accounts
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Connect your official social platform accounts one time for automated publishing
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAccounts}
          title="Refresh"
          className="p-2.5 rounded-xl bg-[#11131A] border border-[#1E2230] text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-white ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Selection Modal for Multi-Page Users */}
      {selectingPage && pendingPages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141724] border border-[#272D40] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Facebook className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-white">
                  Select Facebook Page to Connect
                </h2>
              </div>
              <p className="text-xs text-gray-400">
                You manage multiple Facebook Pages. Choose which Page and linked Instagram account you want to connect.
              </p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {pendingPages.map((p) => {
                const hasIg = Boolean(p.instagramAccount?.id && p.instagramAccount?.username);
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-[#181B26] border border-[#272D40] hover:border-blue-500/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-white">
                        {p.name}
                      </div>
                      <div className="text-xs flex items-center gap-1.5">
                        {hasIg ? (
                          <span className="text-pink-400 font-medium flex items-center gap-1">
                            <Instagram className="w-3.5 h-3.5" />
                            @{p.instagramAccount.username}
                          </span>
                        ) : (
                          <span className="text-amber-400/90 italic text-[11px]">
                            No Instagram Professional account is connected to this Facebook Page.
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPage(p.id)}
                      disabled={pageSubmitting}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 flex-shrink-0 transition-colors disabled:opacity-50"
                    >
                      {pageSubmitting ? "Connecting..." : "Select Page"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1E2230]">
              <button
                type="button"
                onClick={() => setSelectingPage(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts List: YouTube, Facebook, Instagram, Snapchat, ShareChat */}
      <div className="space-y-4">
        <SocialAccountCard
          platform="youtube"
          account={youtubeAccount}
          onDisconnect={handleDisconnect}
          isMockMode={isMockMode}
        />

        <SocialAccountCard
          platform="facebook"
          account={facebookAccount}
          onDisconnect={handleDisconnect}
          isMockMode={isMockMode}
        />

        <SocialAccountCard
          platform="instagram"
          account={instagramAccount}
          onDisconnect={handleDisconnect}
          isMockMode={isMockMode}
        />

        <SocialAccountCard
          platform="snapchat"
          account={snapchatAccount}
          onDisconnect={handleDisconnect}
          isMockMode={isMockMode}
        />

        <SocialAccountCard
          platform="sharechat"
          account={sharechatAccount}
          onDisconnect={handleDisconnect}
          isMockMode={isMockMode}
        />
      </div>
    </div>
  );
}
