import test from "node:test";
import assert from "node:assert/strict";

const PLATFORM_CONFIGS = {
  instagram: {
    name: "Instagram",
    allowedMimeTypes: ["video/mp4", "video/quicktime"],
    maxFileSizeBytes: 1024 * 1024 * 1024, // 1 GB
    maxDurationSeconds: 900,
    minDurationSeconds: 3,
    maxCaptionLength: 2200,
  },
  facebook: {
    name: "Facebook",
    allowedMimeTypes: ["video/mp4", "video/quicktime", "video/x-m4v"],
    maxFileSizeBytes: 4 * 1024 * 1024 * 1024,
    maxDurationSeconds: 14400,
    minDurationSeconds: 1,
    maxCaptionLength: 5000,
  },
  youtube: {
    name: "YouTube",
    allowedMimeTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"],
    maxFileSizeBytes: 10 * 1024 * 1024 * 1024,
    maxDurationSeconds: 43200,
    minDurationSeconds: 1,
    maxCaptionLength: 5000,
  },
};

function validateForPlatform(platform, metadata) {
  const config = PLATFORM_CONFIGS[platform];
  const issues = [];

  if (!config.allowedMimeTypes.includes(metadata.mimeType.toLowerCase())) {
    issues.push({ field: "mimeType", message: "Unsupported format" });
  }

  if (metadata.size > config.maxFileSizeBytes) {
    issues.push({ field: "fileSize", message: "File size exceeds limit" });
  }

  if (metadata.duration !== undefined && metadata.duration > 0) {
    if (metadata.duration < config.minDurationSeconds) {
      issues.push({ field: "duration", message: "Duration too short" });
    }
    if (metadata.duration > config.maxDurationSeconds) {
      issues.push({ field: "duration", message: "Duration exceeds limit" });
    }
  }

  if (metadata.caption.length > config.maxCaptionLength) {
    issues.push({ field: "caption", message: "Caption too long" });
  }

  return issues;
}

test("Platform Validation: Accepts valid MP4 for all platforms", () => {
  const valid = {
    mimeType: "video/mp4",
    size: 25 * 1024 * 1024, // 25 MB
    duration: 45, // 45s
    caption: "Great day building projects!",
  };

  assert.equal(validateForPlatform("instagram", valid).length, 0);
  assert.equal(validateForPlatform("facebook", valid).length, 0);
  assert.equal(validateForPlatform("youtube", valid).length, 0);
});

test("Platform Validation: Rejects invalid mime types", () => {
  const invalidMime = {
    mimeType: "audio/mp3",
    size: 10 * 1024 * 1024,
    duration: 30,
    caption: "Sound bite",
  };

  const issues = validateForPlatform("instagram", invalidMime);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].field, "mimeType");
});

test("Platform Validation: Enforces Instagram max caption length (2,200 chars)", () => {
  const giantCaption = "a".repeat(2500);
  const issues = validateForPlatform("instagram", {
    mimeType: "video/mp4",
    size: 5 * 1024 * 1024,
    duration: 15,
    caption: giantCaption,
  });

  assert.equal(issues.length, 1);
  assert.equal(issues[0].field, "caption");
});
