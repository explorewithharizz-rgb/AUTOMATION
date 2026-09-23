"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch by rendering a placeholder of identical size
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-gray-200 dark:border-[#1E2230] bg-gray-100 dark:bg-[#11131A] animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-sm font-medium transition-all duration-200 
        bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 shadow-sm
        dark:bg-[#11131A] dark:hover:bg-[#181B26] dark:text-gray-300 dark:border-[#1E2230] dark:shadow-none
        hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle light and dark theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="ml-2 text-xs font-semibold">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const options = [
    { value: "light", label: "Light", icon: Sun, desc: "Clean white & slate theme" },
    { value: "dark", label: "Dark", icon: Moon, desc: "Modern deep navy midnight theme" },
    { value: "system", label: "System", icon: Monitor, desc: "Syncs automatically with your device" },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 ${
              isSelected
                ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20 shadow-sm"
                : "border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#11131A] hover:bg-gray-50 dark:hover:bg-[#181B26]"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`p-2 rounded-lg ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              )}
            </div>
            <span
              className={`text-sm font-semibold ${
                isSelected
                  ? "text-indigo-900 dark:text-indigo-300"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {opt.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
              {opt.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}
