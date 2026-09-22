"use client";

import { AlertCircle } from "lucide-react";

export function MockModeBadge() {
  const isMock = process.env.NEXT_PUBLIC_SOCIAL_API_MOCK_MODE === "true";

  if (!isMock) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
      <AlertCircle className="w-3 h-3" />
      <span>Mock Mode Active (Simulation)</span>
    </div>
  );
}
