import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeHashtags,
  toggleHashtagInCaption,
  analyzeVideoWithAI,
} from "../lib/ai/video-analysis.ts";

test("Hashtags: sanitizeHashtags cleans, prefixes with # and deduplicates", () => {
  const input = ["marketing", "#Marketing", "growth_tips", "#social2026", null, undefined, "", "#growth_tips"];
  const result = sanitizeHashtags(input);

  assert.deepEqual(result, ["#marketing", "#growth_tips", "#social2026"]);
});

test("Hashtags: toggleHashtagInCaption adds a missing hashtag cleanly", () => {
  const initialCaption = "This is a great tutorial on video production.";
  const tag = "#filmmaking";
  const updated = toggleHashtagInCaption(initialCaption, tag);

  assert.ok(updated.includes("#filmmaking"));
  assert.ok(updated.startsWith("This is a great tutorial"));
});

test("Hashtags: toggleHashtagInCaption removes an existing hashtag cleanly", () => {
  const initialCaption = "Check out this workflow! #productivity #tips";
  const tag = "#productivity";
  const updated = toggleHashtagInCaption(initialCaption, tag);

  assert.ok(!updated.includes("#productivity"));
  assert.ok(updated.includes("#tips"));
  assert.ok(updated.includes("Check out this workflow!"));
});

test("Video Analysis Fallback: Generates professional structure when AI service is unavailable", async () => {
  // Test fallback with no API key
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const result = await analyzeVideoWithAI({
      filename: "product_launch_demo.mp4",
      tone: "professional",
      length: "standard",
      duration: 60,
      platforms: ["youtube", "instagram"],
    });

    assert.ok(result.caption.length > 0, "Caption should not be empty");
    assert.ok(result.title.length > 0, "Title should not be empty");
    assert.ok(result.hashtags.length >= 4, "Should have at least 4 hashtags");
    assert.ok(result.videoSummary.length > 0, "Video summary should be populated");
    assert.ok(result.hook.length > 0, "Hook should be populated");
    assert.ok(result.cta.length > 0, "CTA should be populated");
    assert.equal(result.modelUsed, "heuristic-fallback");
  } finally {
    if (prevKey) process.env.GEMINI_API_KEY = prevKey;
  }
});

test("Video Analysis Fallback: Generates viral tone with appropriate hooks", async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const result = await analyzeVideoWithAI({
      filename: "behind_the_scenes_studio.mp4",
      prompt: "Creative studio tour",
      tone: "viral",
      platforms: ["instagram", "tiktok"],
    });

    assert.ok(result.caption.toLowerCase().includes("see") || result.caption.toLowerCase().includes("watch"));
    assert.ok(result.hashtags.some(t => t === "#viral" || t === "#trending"));
  } finally {
    if (prevKey) process.env.GEMINI_API_KEY = prevKey;
  }
});
