"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Plus,
  Minus,
  Film,
  Tag,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { Platform, VideoMetadata, CaptionTone, CaptionLength } from "@/types";

interface CaptionEditorProps {
  caption: string;
  onCaptionChange: (caption: string) => void;
  youtubeTitle: string;
  onYoutubeTitleChange: (title: string) => void;
  isYouTubeSelected: boolean;
  privacyStatus?: "public" | "unlisted" | "private";
  onPrivacyStatusChange?: (status: "public" | "unlisted" | "private") => void;
  videoFile?: File | null;
  videoMetadata?: VideoMetadata | null;
  selectedPlatforms?: Platform[];
}

const TONE_OPTIONS: { id: CaptionTone; label: string; icon: string; desc: string }[] = [
  { id: "viral", label: "Viral / Hook", icon: "🔥", desc: "Curiosity hook, punchy emojis, comment driver" },
  { id: "professional", label: "Professional", icon: "👔", desc: "Articulate, authoritative, business-ready" },
  { id: "educational", label: "Educational", icon: "📚", desc: "Step-by-step takeaways, structured insights" },
  { id: "promotional", label: "Promotional", icon: "🛍️", desc: "Compelling value, urgency, direct CTA" },
  { id: "storytelling", label: "Storytelling", icon: "📖", desc: "Narrative, emotional, personal connection" },
  { id: "minimalist", label: "Minimalist", icon: "⚡", desc: "Short, impactful, zero fluff" },
];

const LENGTH_OPTIONS: { id: CaptionLength; label: string; desc: string }[] = [
  { id: "punchy", label: "Punchy", desc: "Short & snappy (Reels/TikTok)" },
  { id: "standard", label: "Balanced", desc: "Recommended (Hook + Body + CTA)" },
  { id: "detailed", label: "In-Depth", desc: "Comprehensive (LinkedIn/FB)" },
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
  videoMetadata,
  selectedPlatforms = ["instagram", "facebook", "youtube"],
}: CaptionEditorProps) {
  // Advanced settings & menus
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [showAdvancedYoutube, setShowAdvancedYoutube] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // AI Configuration State
  const [selectedTone, setSelectedTone] = useState<CaptionTone>("viral");
  const [selectedLength, setSelectedLength] = useState<CaptionLength>("standard");
  const [aiPrompt, setAiPrompt] = useState("");
  const [autoAnalyzeOnUpload, setAutoAnalyzeOnUpload] = useState(true);

  // Generation status & progress
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeGeneratingTone, setActiveGeneratingTone] = useState<CaptionTone | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);

  // AI Generated Results
  const [videoSummary, setVideoSummary] = useState<string | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [hashtagCategories, setHashtagCategories] = useState<{
    trending: string[];
    niche: string[];
    community: string[];
  }>({ trending: [], niche: [], community: [] });
  const [activeTagTab, setActiveTagTab] = useState<"all" | "trending" | "niche" | "community">("all");
  const [copiedTags, setCopiedTags] = useState(false);

  // Cached keyframes for instant tone switching without re-extracting
  const cachedFramesRef = useRef<string[]>([]);
  const lastAnalyzedFileRef = useRef<string | null>(null);

  /**
   * Extracts 4 lightweight keyframes across the video file
   */
  const extractVideoKeyframes = async (
    file: File,
    onProgress?: (msg: string) => void
  ): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      const cleanup = () => {
        URL.revokeObjectURL(url);
      };

      video.onloadeddata = async () => {
        try {
          const frames: string[] = [];
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const duration = video.duration || 1;
          // Target max 480px dimension to keep base64 payload very lightweight and fast
          const maxDim = 480;
          const scale = Math.min(1, maxDim / Math.max(video.videoWidth || 480, video.videoHeight || 320, 1));
          canvas.width = Math.max(160, Math.round((video.videoWidth || 480) * scale));
          canvas.height = Math.max(90, Math.round((video.videoHeight || 320) * scale));

          // 4 keyframe timestamps across the video narrative (15%, 40%, 65%, 88%)
          const timestamps = [
            duration * 0.15,
            duration * 0.4,
            duration * 0.65,
            duration * 0.88,
          ];

          for (let i = 0; i < timestamps.length; i++) {
            const time = timestamps[i];
            onProgress?.(`Extracting keyframe ${i + 1} of ${timestamps.length}...`);
            video.currentTime = Math.min(time, Math.max(0, duration - 0.1));

            await new Promise<void>((res) => {
              let resolved = false;
              const handleSeeked = () => {
                if (resolved) return;
                resolved = true;
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
                  frames.push(dataUrl.split(",")[1]);
                }
                res();
              };

              const timer = setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  res();
                }
              }, 1800);

              video.onseeked = () => {
                clearTimeout(timer);
                handleSeeked();
              };
            });
          }

          cleanup();
          resolve(frames);
        } catch (err) {
          cleanup();
          reject(err);
        }
      };

      video.onerror = () => {
        cleanup();
        reject(new Error("Unable to decode video frames."));
      };
    });
  };

  /**
   * Main AI Video Analysis Trigger
   */
  const handleAnalyzeVideo = async (
    isAuto = false,
    toneOverride?: CaptionTone,
    lengthOverride?: CaptionLength
  ) => {
    const file = videoFile || videoMetadata?.file;
    const toneToUse = toneOverride || selectedTone;
    const lengthToUse = lengthOverride || selectedLength;

    if (!file && !aiPrompt.trim()) {
      setAiError("Please select a video file or enter a topic prompt.");
      return;
    }

    setIsAnalyzing(true);
    setActiveGeneratingTone(toneToUse);
    setAiError(null);
    setAnalysisStatus("Analyzing video...");

    try {
      let frames: string[] = cachedFramesRef.current;

      // Extract frames if not already cached
      if (file && frames.length === 0) {
        setAnalysisStatus("Extracting video keyframes...");
        try {
          frames = await extractVideoKeyframes(file, (msg) => setAnalysisStatus(msg));
          cachedFramesRef.current = frames;
        } catch (e) {
          console.warn("[CaptionEditor] Keyframe extraction warning:", e);
        }
      }

      setAnalysisStatus(`Generating ${toneToUse} caption & hashtags...`);

      const payload = {
        frames,
        prompt: aiPrompt.trim(),
        tone: toneToUse,
        length: lengthToUse,
        platforms: selectedPlatforms,
        filename: file?.name || videoMetadata?.filename || "video.mp4",
        duration: videoMetadata?.duration || 0,
      };

      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "AI video analysis failed.");
      }

      const data = await res.json();

      if (data.caption) {
        // Set caption
        onCaptionChange(data.caption);

        // Store video visual summary & title
        if (data.videoSummary) {
          setVideoSummary(data.videoSummary);
        }
        if (data.title) {
          setSuggestedTitle(data.title);
          // If youtube title is currently empty, or if user switched tone, update it
          if (!youtubeTitle.trim() || toneOverride) {
            onYoutubeTitleChange(data.title);
          }
        }

        // Store hashtags
        if (Array.isArray(data.hashtags) && data.hashtags.length > 0) {
          setSuggestedHashtags(data.hashtags);
        }
        if (data.hashtagCategories) {
          setHashtagCategories({
            trending: data.hashtagCategories.trending || [],
            niche: data.hashtagCategories.niche || [],
            community: data.hashtagCategories.community || [],
          });
        }
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("[CaptionEditor] Analysis failed:", err);
      if (!isAuto) {
        setAiError(err.message || "Failed to analyze video. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
      setActiveGeneratingTone(null);
      setAnalysisStatus("");
    }
  };

  /**
   * Handle user clicking a tone button: updates state and triggers instant generation!
   */
  const handleSelectTone = (tone: CaptionTone) => {
    setSelectedTone(tone);
    const file = videoFile || videoMetadata?.file;
    if (file || aiPrompt.trim() || cachedFramesRef.current.length > 0) {
      handleAnalyzeVideo(false, tone);
    }
  };

  /**
   * Handle user clicking a length button: updates state and triggers instant generation!
   */
  const handleSelectLength = (len: CaptionLength) => {
    setSelectedLength(len);
    const file = videoFile || videoMetadata?.file;
    if (file || aiPrompt.trim() || cachedFramesRef.current.length > 0) {
      handleAnalyzeVideo(false, undefined, len);
    }
  };

  // Reset cached keyframes if video file changes
  useEffect(() => {
    const file = videoFile || videoMetadata?.file;
    if (file) {
      const fileKey = `${file.name}-${file.size}`;
      if (lastAnalyzedFileRef.current !== fileKey) {
        cachedFramesRef.current = [];
        lastAnalyzedFileRef.current = fileKey;
        if (autoAnalyzeOnUpload && !caption.trim() && !isAnalyzing) {
          handleAnalyzeVideo(true);
        }
      }
    } else {
      cachedFramesRef.current = [];
      lastAnalyzedFileRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFile, videoMetadata?.file, autoAnalyzeOnUpload]);

  /**
   * Hashtag Insertion / Toggling
   */
  const isTagInCaption = (tag: string) => {
    const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
    const regex = new RegExp(`(^|\\s)${escapeRegex(cleanTag)}(?=\\s|$)`, "i");
    return regex.test(caption);
  };

  const toggleHashtag = (tag: string) => {
    const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
    const regex = new RegExp(`(^|\\s)${escapeRegex(cleanTag)}(?=\\s|$)`, "gi");

    if (regex.test(caption)) {
      // Remove tag
      const updated = caption
        .replace(regex, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/ \n/g, "\n")
        .trim();
      onCaptionChange(updated);
    } else {
      // Append tag
      const trimmed = caption.trim();
      if (!trimmed) {
        onCaptionChange(cleanTag);
        return;
      }
      const endsWithTag = /#[a-zA-Z0-9_]+$/.test(trimmed);
      if (endsWithTag) {
        onCaptionChange(`${trimmed} ${cleanTag}`);
      } else {
        onCaptionChange(`${trimmed}\n\n${cleanTag}`);
      }
    }
  };

  const addAllHashtags = () => {
    const missing = suggestedHashtags.filter((t) => !isTagInCaption(t));
    if (missing.length === 0) return;

    const trimmed = caption.trim();
    const tagsString = missing.join(" ");
    if (!trimmed) {
      onCaptionChange(tagsString);
      return;
    }
    const endsWithTag = /#[a-zA-Z0-9_]+$/.test(trimmed);
    if (endsWithTag) {
      onCaptionChange(`${trimmed} ${tagsString}`);
    } else {
      onCaptionChange(`${trimmed}\n\n${tagsString}`);
    }
  };

  const copyAllHashtags = () => {
    if (suggestedHashtags.length === 0) return;
    navigator.clipboard.writeText(suggestedHashtags.join(" "));
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Filter tags based on active tab
  const displayedTags =
    activeTagTab === "all"
      ? suggestedHashtags
      : activeTagTab === "trending"
      ? hashtagCategories.trending
      : activeTagTab === "niche"
      ? hashtagCategories.niche
      : hashtagCategories.community;

  // Count hashtags in current caption
  const currentTagsCount = (caption.match(/#[a-zA-Z0-9_]+/g) || []).length;

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* AI VIDEO ANALYSIS PANEL */}
      {/* ============================================================== */}
      <div className="rounded-xl border border-indigo-500/25 bg-gradient-to-b from-[#181B28] to-[#12141D] p-4 shadow-lg shadow-indigo-950/20">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  AI Video Analysis & Strategy
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Multimodal Vision
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Analyzes video keyframes to craft tone-specific captions, viral hooks & hashtags.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#202538] transition-colors"
            title="Toggle AI Controls"
          >
            {showAiPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Video Detected Status Banner */}
        {videoFile || videoMetadata ? (
          <div className="mb-3 px-3 py-2 rounded-lg bg-[#10121A] border border-[#23283B] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Film className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="text-gray-300 truncate font-medium">
                {videoFile?.name || videoMetadata?.filename}
              </span>
              {videoMetadata?.duration ? (
                <span className="text-gray-500 text-[11px]">
                  ({videoMetadata.duration}s)
                </span>
              ) : null}
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-400 hover:text-gray-300">
              <input
                type="checkbox"
                checked={autoAnalyzeOnUpload}
                onChange={(e) => setAutoAnalyzeOnUpload(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#272D40] text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Auto-analyze on upload</span>
            </label>
          </div>
        ) : null}

        {/* Expanded Controls */}
        {showAiPanel && (
          <div className="space-y-3.5 pt-1 border-t border-[#23283B]">
            {/* Tone Selector with 1-click re-generation */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span>Select Caption Tone (Click to switch instantly)</span>
                <span className="text-[10px] text-indigo-400 font-medium">
                  {TONE_OPTIONS.find((t) => t.id === selectedTone)?.desc}
                </span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {TONE_OPTIONS.map((opt) => {
                  const isSelected = selectedTone === opt.id;
                  const isThisGenerating = isAnalyzing && activeGeneratingTone === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectTone(opt.id)}
                      disabled={isAnalyzing}
                      className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/30 text-white border-indigo-400 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400"
                          : "bg-[#11131A] text-gray-400 border-[#23283B] hover:text-white hover:border-[#38415c]"
                      }`}
                    >
                      <span className="text-sm mb-0.5">
                        {isThisGenerating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        ) : (
                          opt.icon
                        )}
                      </span>
                      <span className="text-[11px] font-semibold truncate max-w-full">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Length Preference */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Length
              </span>
              <div className="inline-flex rounded-lg bg-[#11131A] p-0.5 border border-[#23283B]">
                {LENGTH_OPTIONS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleSelectLength(l.id)}
                    disabled={isAnalyzing}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedLength === l.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Custom Topic / Prompt Drawer */}
            <div>
              <button
                type="button"
                onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Sliders className="w-3 h-3" />
                <span>{showCustomPrompt ? "Hide custom topic / instructions" : "+ Add custom topic or instructions"}</span>
              </button>

              {showCustomPrompt && (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={2}
                    placeholder="e.g. Focus on discount code SAVE20, emphasize high-intensity cardio, mention our event on Friday..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#11131A] border border-[#23283B] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAnalyzeVideo(false)}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    Apply Instructions to Caption
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {aiError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Action Button & In-Flight Status */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAnalyzeVideo(false)}
                disabled={isAnalyzing}
                className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Video...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{caption ? `Re-Analyze (${selectedTone.toUpperCase()})` : "Analyze Video & Generate Captions"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Progress Stage Notification */}
            {isAnalyzing && (
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-indigo-300 text-xs animate-pulse">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>{analysisStatus || "Analyzing video frames with AI..."}</span>
              </div>
            )}

            {/* Visual Analysis Detection Summary */}
            {videoSummary && !isAnalyzing && (
              <div className="p-2.5 rounded-lg bg-[#10121A] border border-indigo-500/20 text-xs">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AI Video Scene Breakdown</span>
                </div>
                <p className="text-gray-300 italic text-[11px] leading-relaxed">
                  &ldquo;{videoSummary}&rdquo;
                </p>
              </div>
            )}

            {/* Suggested Title Bar */}
            {suggestedTitle && (
              <div className="p-2.5 rounded-lg bg-[#10121A] border border-[#23283B] flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                    Suggested Video Title
                  </span>
                  <span className="text-white font-medium truncate block text-xs">
                    {suggestedTitle}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onYoutubeTitleChange(suggestedTitle)}
                  className="px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold whitespace-nowrap transition-colors"
                >
                  Apply Title
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* CAPTION TEXTAREA & LIVE METRICS */}
      {/* ============================================================== */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <span>Post Caption</span>
            {currentTagsCount > 0 && (
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {currentTagsCount} {currentTagsCount === 1 ? "hashtag" : "hashtags"}
              </span>
            )}
          </label>

          <span className="text-[11px] text-gray-500">
            {caption.length} / 2,200 characters
          </span>
        </div>

        <div className="relative">
          <textarea
            rows={5}
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Write or generate a professional caption with hook, body, and CTA..."
            className="w-full p-3.5 bg-[#11131A] border border-[#1E2230] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-y min-h-[130px] leading-relaxed"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* INTERACTIVE HASHTAG MANAGER */}
      {/* ============================================================== */}
      {suggestedHashtags.length > 0 && (
        <div className="p-3.5 rounded-xl bg-[#11131A] border border-[#1E2230] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Recommended Hashtags</span>
              <span className="text-[10px] text-gray-500">
                (Click to toggle into caption)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={addAllHashtags}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[11px] font-medium transition-colors cursor-pointer"
                title="Append all hashtags to caption"
              >
                <Plus className="w-3 h-3" />
                <span>Add All</span>
              </button>

              <button
                type="button"
                onClick={copyAllHashtags}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#181B26] hover:bg-[#202538] border border-[#272D40] text-gray-300 text-[11px] font-medium transition-colors cursor-pointer"
                title="Copy all hashtags to clipboard"
              >
                {copiedTags ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTags ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Hashtag Category Filter Tabs */}
          {(hashtagCategories.trending.length > 0 || hashtagCategories.niche.length > 0) && (
            <div className="flex items-center gap-1 border-b border-[#1E2230] pb-2 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTagTab("all")}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  activeTagTab === "all"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                All ({suggestedHashtags.length})
              </button>
              {hashtagCategories.trending.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTagTab("trending")}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    activeTagTab === "trending"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Trending ({hashtagCategories.trending.length})
                </button>
              )}
              {hashtagCategories.niche.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTagTab("niche")}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    activeTagTab === "niche"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Niche ({hashtagCategories.niche.length})
                </button>
              )}
              {hashtagCategories.community.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTagTab("community")}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    activeTagTab === "community"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Community ({hashtagCategories.community.length})
                </button>
              )}
            </div>
          )}

          {/* Interactive Tag Chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {displayedTags.map((tag) => {
              const inCaption = isTagInCaption(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleHashtag(tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    inCaption
                      ? "bg-indigo-600/25 text-indigo-300 border-indigo-500/60 shadow-sm shadow-indigo-500/10"
                      : "bg-[#181B26] text-gray-400 border-[#272D40] hover:text-white hover:border-[#38415c]"
                  }`}
                >
                  <span>{tag}</span>
                  {inCaption ? (
                    <Minus className="w-3 h-3 text-indigo-400" />
                  ) : (
                    <Plus className="w-3 h-3 text-gray-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* OPTIONAL CUSTOM YOUTUBE TITLE & PRIVACY */}
      {/* ============================================================== */}
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
                  placeholder="Leave blank to auto-generate title from caption or AI"
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
