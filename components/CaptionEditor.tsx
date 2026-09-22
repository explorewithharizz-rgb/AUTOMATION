"use client";

import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface CaptionEditorProps {
  caption: string;
  onCaptionChange: (caption: string) => void;
  youtubeTitle: string;
  onYoutubeTitleChange: (title: string) => void;
  isYouTubeSelected: boolean;
  privacyStatus?: "public" | "unlisted" | "private";
  onPrivacyStatusChange?: (status: "public" | "unlisted" | "private") => void;
  videoFile?: File | null;
}

const AI_SUGGESTIONS = [
  "🚀 You won't believe how simple this is! Here is the full breakdown. Drop a comment with your thoughts! 👇 #trending #viral #growth",
  "💡 The 1 simple trick everyone is talking about. Save this for later! 📌 #creator #tips #learn",
  "🔥 Behind the scenes of what really happens. Watch till the end! 🎬 #viralreels #shorts #bts",
  "⚡ Stop making this mistake today. Here is what you should do instead! 📈 #productivity #mindset",
];

export function CaptionEditor({
  caption,
  onCaptionChange,
  youtubeTitle,
  onYoutubeTitleChange,
  isYouTubeSelected,
  privacyStatus = "public",
  onPrivacyStatusChange,
  videoFile,
}: CaptionEditorProps) {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showAdvancedYoutube, setShowAdvancedYoutube] = useState(false);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const extractFrames = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      
      video.onloadeddata = async () => {
        const frames: string[] = [];
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Target max 480p to keep base64 payload very small for speed
        const scale = Math.min(1, 480 / Math.max(video.videoHeight, 1));
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        const timestamps = [
          video.duration * 0.15,
          video.duration * 0.5,
          video.duration * 0.85
        ];

        for (const time of timestamps) {
          video.currentTime = time;
          await new Promise(r => {
            video.onseeked = () => {
              if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
              r(null);
            };
          });
        }
        URL.revokeObjectURL(url);
        resolve(frames);
      };
      video.onerror = () => reject(new Error("Failed to load video for AI analysis"));
    });
  };

  const generateCaption = async (isAuto = false) => {
    if (!videoFile && !aiPrompt.trim()) return;
    
    setIsGenerating(true);
    setAiError("");

    try {
      let frames: string[] = [];
      if (videoFile) {
        try {
          frames = await extractFrames(videoFile);
        } catch (e) {
          console.warn("Auto-frame extraction failed:", e);
        }
      }

      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames, prompt: aiPrompt.trim() })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      if (data.caption) {
        onCaptionChange(data.caption);
        setShowAiMenu(false);
      }
    } catch (err: any) {
      if (!isAuto) setAiError(err.message || "Failed to generate auto-caption.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate caption when video is uploaded if caption is empty
  useEffect(() => {
    if (videoFile && !caption.trim() && !isGenerating) {
      generateCaption(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFile]);

  const applySuggestion = (suggestion: string) => {
    onCaptionChange(suggestion);
    setShowAiMenu(false);
  };

  return (
    <div className="space-y-4">
      {/* Caption Textarea Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Caption
        </label>

        {/* AI Suggest Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAiMenu(!showAiMenu)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Suggest</span>
          </button>

          {showAiMenu && (
            <div className="absolute right-0 mt-2 w-[340px] rounded-xl bg-[#181B26] border border-[#272D40] shadow-2xl p-4 z-30 flex flex-col gap-3">
              <div className="text-xs font-semibold text-gray-300 flex items-center gap-2 border-b border-[#272D40] pb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Gemini AI Caption Generator
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">
                  Video Topic / Prompt <span className="text-gray-500 lowercase">(optional if video uploaded)</span>
                </label>
                <textarea 
                  rows={2} 
                  placeholder="e.g. A funny dog trying to catch a laser pointer..." 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full text-xs p-2 bg-[#11131A] border border-[#272D40] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {aiError && <div className="text-[10px] text-red-400 bg-red-500/10 p-1.5 rounded">{aiError}</div>}

              <button
                type="button"
                onClick={() => generateCaption(false)}
                disabled={isGenerating}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>Generate Caption</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Caption Textarea */}
      <div className="relative">
        <textarea
          rows={4}
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Write your caption here... (hashtags, links, and mentions supported)"
          className="w-full p-3.5 bg-[#11131A] border border-[#1E2230] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-y min-h-[110px]"
        />
        <div className="flex justify-end mt-1 text-[11px] text-gray-500">
          <span>{caption.length} / 2,200 characters</span>
        </div>
      </div>

      {/* Optional Custom YouTube Title */}
      {isYouTubeSelected && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedYoutube(!showAdvancedYoutube)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            <span>YouTube Settings & Privacy</span>
            {showAdvancedYoutube ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showAdvancedYoutube && (
            <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-[#11131A] border border-[#1E2230]">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Custom YouTube Title (Optional)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={youtubeTitle}
                  onChange={(e) => onYoutubeTitleChange(e.target.value)}
                  placeholder="Leave blank to auto-generate title from caption"
                  className="w-full px-3 py-2 bg-[#181B26] border border-[#272D40] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <div className="flex justify-between mt-1 text-[11px] text-gray-500">
                  <span>Auto-truncated to 100 characters for YouTube</span>
                  <span>{youtubeTitle.length} / 100</span>
                </div>
              </div>

              {onPrivacyStatusChange && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    YouTube Privacy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "public", label: "Public", desc: "Anyone can view" },
                      { id: "unlisted", label: "Unlisted", desc: "Link only" },
                      { id: "private", label: "Private", desc: "Only you" },
                    ].map((opt) => {
                      const isSelected = (privacyStatus || "public") === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onPrivacyStatusChange(opt.id as any)}
                          className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? "bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm shadow-indigo-500/10"
                              : "bg-[#181B26] text-gray-400 border-[#272D40] hover:text-white"
                          }`}
                        >
                          <span className="font-semibold capitalize">{opt.label}</span>
                          <span className="text-[10px] text-gray-500">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
