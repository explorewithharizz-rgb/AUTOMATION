"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Share2,
  Video,
  ListVideo,
  Calendar,
  Layers,
  Settings,
  LogOut,
  Sparkles,
  Youtube,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  user?: {
    email?: string;
    displayName?: string;
    profileImage?: string;
  } | null;
}

const NAV_ITEMS = [
  { label: "Create Post", href: "/dashboard", icon: Video },
  { label: "YouTube Hub", href: "/youtube", icon: Youtube },
  { label: "Posts", href: "/posts", icon: ListVideo },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Connected Accounts", href: "/connected-accounts", icon: Layers },
  { label: "Settings", href: "/settings", icon: Settings },
];


export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await supabase.auth.signOut().catch(() => {});
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#1E2230] bg-[#0D0F17] h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#1E2230]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight block leading-tight">
              BEWEB Social Automation
            </span>
            <span className="block text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
              Multi-Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#151824]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-gray-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Privacy Policy Link */}
      <div className="px-4 py-2 border-t border-[#1E2230]/60 bg-[#090A0F] text-center">
        <Link
          href="/privacy"
          target="_blank"
          className="text-[11px] text-gray-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
        >
          <Shield className="w-3 h-3 text-gray-500" />
          <span>Privacy Policy</span>
        </Link>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-[#1E2230] bg-[#0A0C13]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.displayName} className="w-8 h-8 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white uppercase flex-shrink-0">
                {user?.displayName?.[0] || user?.email?.[0] || "U"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">
                {user?.displayName || "Creator"}
              </p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
