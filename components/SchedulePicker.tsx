"use client";

import { PostMode } from "@/types";
import { COMMON_TIMEZONES, localToUtcIso, formatInTimezone } from "@/lib/utils/timezone";
import { Calendar, Clock, Globe } from "lucide-react";

interface SchedulePickerProps {
  postMode: PostMode;
  onPostModeChange: (mode: PostMode) => void;
  scheduledDate: string;
  onDateChange: (d: string) => void;
  scheduledTime: string;
  onTimeChange: (t: string) => void;
  timezone: string;
  onTimezoneChange: (tz: string) => void;
}

export function SchedulePicker({
  postMode,
  onPostModeChange,
  scheduledDate,
  onDateChange,
  scheduledTime,
  onTimeChange,
  timezone,
  onTimezoneChange,
}: SchedulePickerProps) {
  // Compute formatted UTC preview
  let utcPreview = "";
  if (scheduledDate && scheduledTime) {
    const utcIso = localToUtcIso(scheduledDate, scheduledTime, timezone);
    utcPreview = formatInTimezone(utcIso, "UTC", { timeZoneName: "short" });
  }

  return (
    <div className="space-y-4">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
        When to Post
      </label>

      {/* Mode Radios */}
      <div className="grid grid-cols-2 gap-3">
        <label
          className={`cursor-pointer flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
            postMode === "now"
              ? "bg-indigo-600/10 border-indigo-500/40 text-white"
              : "bg-[#11131A] border-[#1E2230] text-gray-400 hover:border-gray-700"
          }`}
        >
          <input
            type="radio"
            name="postMode"
            checked={postMode === "now"}
            onChange={() => onPostModeChange("now")}
            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 bg-gray-900"
          />
          <div>
            <span className="text-sm font-semibold block">Post Now</span>
            <span className="text-[11px] text-gray-400">
              Publish immediately across platforms
            </span>
          </div>
        </label>

        <label
          className={`cursor-pointer flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
            postMode === "scheduled"
              ? "bg-indigo-600/10 border-indigo-500/40 text-white"
              : "bg-[#11131A] border-[#1E2230] text-gray-400 hover:border-gray-700"
          }`}
        >
          <input
            type="radio"
            name="postMode"
            checked={postMode === "scheduled"}
            onChange={() => onPostModeChange("scheduled")}
            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 bg-gray-900"
          />
          <div>
            <span className="text-sm font-semibold block">Schedule for Later</span>
            <span className="text-[11px] text-gray-400">
              Set date, time, and timezone
            </span>
          </div>
        </label>
      </div>

      {/* Schedule Form */}
      {postMode === "scheduled" && (
        <div className="p-4 rounded-xl bg-[#11131A] border border-[#1E2230] space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Date */}
            <div>
              <label className="text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => onDateChange(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 bg-[#181B26] border border-[#272D40] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>Time</span>
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#181B26] border border-[#272D40] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-400" />
                <span>Timezone</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => onTimezoneChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#181B26] border border-[#272D40] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {utcPreview && (
            <p className="text-[11px] text-gray-400 pt-1 border-t border-[#1E2230]">
              Will be published at:{" "}
              <span className="text-indigo-300 font-medium">{utcPreview}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
