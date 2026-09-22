"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, Film, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { VideoMetadata } from "@/types";

interface UploadDropzoneProps {
  metadata: VideoMetadata | null;
  onMetadataChange: (meta: VideoMetadata | null) => void;
  isUploading: boolean;
  uploadProgress: number;
  onStartUpload: (file: File) => Promise<void>;
}

export function UploadDropzone({
  metadata,
  onMetadataChange,
  isUploading,
  uploadProgress,
  onStartUpload,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setError(null);

    // Validate type
    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file (MP4, MOV, or WebM).");
      return;
    }

    // Validate size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError("Video file size cannot exceed 500 MB.");
      return;
    }

    try {
      // 1. Extract video metadata & client-side thumbnail
      const { duration, width, height, thumbnail } = await extractVideoDetails(file);

      const newMeta: VideoMetadata = {
        file,
        filename: file.name,
        size: file.size,
        duration: Math.round(duration),
        width,
        height,
        mimeType: file.type,
        thumbnailUrl: thumbnail,
      };

      onMetadataChange(newMeta);

      // 2. Start direct upload
      await onStartUpload(file);
    } catch (err: any) {
      setError(err?.message || "Failed to process video file.");
    }
  };

  const extractVideoDetails = (
    file: File
  ): Promise<{ duration: number; width: number; height: number; thumbnail: string }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.preload = "metadata";
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        // Seek to 1 second for thumbnail
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL("image/jpeg", 0.7);

          URL.revokeObjectURL(url);
          resolve({
            duration: video.duration || 0,
            width: video.videoWidth || 0,
            height: video.videoHeight || 0,
            thumbnail,
          });
        } catch {
          URL.revokeObjectURL(url);
          resolve({
            duration: video.duration || 0,
            width: video.videoWidth || 0,
            height: video.videoHeight || 0,
            thumbnail: "",
          });
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to read video file format."));
      };
    });
  };

  const handleRemove = () => {
    onMetadataChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-m4v,video/webm"
        className="hidden"
        onChange={handleFileInput}
      />

      {error && (
        <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!metadata ? (
        /* Empty Upload Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? "border-indigo-500 bg-indigo-500/10 scale-[0.99]"
              : "border-[#1E2230] hover:border-indigo-500/40 bg-[#11131A] hover:bg-[#141824]"
          }`}
        >
          <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-200 mb-1">
            Drag and drop your video here, or{" "}
            <span className="text-indigo-400">browse</span>
          </p>
          <p className="text-xs text-gray-500">
            MP4, MOV or WebM up to 500 MB • Optimized for Reels, TikTok & Shorts
          </p>
        </div>
      ) : (
        /* Video Uploaded Card */
        <div className="glass-card rounded-2xl p-4 border border-[#1E2230] bg-[#11131A] relative">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="w-20 h-24 rounded-xl bg-[#181B26] overflow-hidden flex-shrink-0 relative border border-[#272D40] flex items-center justify-center">
              {metadata.thumbnailUrl ? (
                <img
                  src={metadata.thumbnailUrl}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Film className="w-8 h-8 text-gray-500" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 py-0.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium text-white truncate">
                  {metadata.filename}
                </h4>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-3">
                <span className="bg-[#181B26] px-2 py-0.5 rounded-md border border-[#272D40]">
                  {formatFileSize(metadata.size)}
                </span>
                <span className="bg-[#181B26] px-2 py-0.5 rounded-md border border-[#272D40]">
                  {formatDuration(metadata.duration)}
                </span>
                {metadata.width > 0 && (
                  <span className="bg-[#181B26] px-2 py-0.5 rounded-md border border-[#272D40]">
                    {metadata.width}x{metadata.height}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {isUploading ? (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                      Uploading directly to secure storage...
                    </span>
                    <span className="font-semibold text-indigo-400">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1E2230] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Video uploaded to storage & ready</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
