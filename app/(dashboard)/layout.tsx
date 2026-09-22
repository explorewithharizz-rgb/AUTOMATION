import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { MockModeBadge } from "@/components/MockModeBadge";

import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { email: string; displayName: string; profileImage?: string } | null = null;
  const authUser = await getAuthenticatedUser();

  if (authUser) {
    user = {
      email: authUser.email || "",
      displayName: authUser.name || authUser.email.split("@")[0] || "Creator",
      profileImage: authUser.profileImage || undefined,
    };
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#090A0F] text-gray-100">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <MobileNav />
        {/* Top bar for mock indicator and status */}
        <header className="px-6 py-3 border-b border-[#1E2230]/60 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            BEWEB Social Automation Engine
          </span>
          <MockModeBadge />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
