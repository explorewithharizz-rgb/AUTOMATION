"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Share2, Video, ListVideo, Calendar, Layers, Settings, Youtube } from "lucide-react";

const NAV_ITEMS = [
  { label: "Create", href: "/dashboard", icon: Video },
  { label: "YouTube", href: "/youtube", icon: Youtube },
  { label: "Posts", href: "/posts", icon: ListVideo },
  { label: "Accounts", href: "/connected-accounts", icon: Layers },
  { label: "Settings", href: "/settings", icon: Settings },
];


export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top Mobile Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#1E2230] bg-[#0D0F17] sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
            <Share2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            BEWEB Social Automation
          </span>
        </Link>
      </div>

      {/* Bottom Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#1E2230] bg-[#0D0F17]/95 backdrop-blur-md z-40 px-2 py-1.5 flex justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? "text-indigo-400" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
