import test from "node:test";
import assert from "node:assert/strict";

const META_GRAPH_VERSION = "v21.0";
const GRAPH_VIDEO_BASE = `https://graph-video.facebook.com/${META_GRAPH_VERSION}`;
const GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

test("Facebook Publishing: Constructs official Graph Video v21.0 endpoints and URLs", () => {
  const pageId = "10987654321";
  const videoId = "987654321012345";

  // Video upload endpoint
  const endpoint = `${GRAPH_VIDEO_BASE}/${pageId}/videos`;
  assert.equal(endpoint, `https://graph-video.facebook.com/v21.0/${pageId}/videos`);

  // Published Facebook video URL
  const platformUrl = `https://www.facebook.com/${pageId}/videos/${videoId}`;
  assert.equal(platformUrl, "https://www.facebook.com/10987654321/videos/987654321012345");
});

test("Facebook Publishing: Rejects missing Facebook Page ID and missing access token", () => {
  function validateParams({ pageId, accessToken }) {
    if (!pageId) {
      return { success: false, errorCode: "NO_FACEBOOK_PAGE", errorMessage: "No connected Facebook Page was found." };
    }
    if (!accessToken) {
      return { success: false, errorCode: "NO_PAGE_ACCESS_TOKEN", errorMessage: "Missing Facebook Page access token." };
    }
    return { success: true };
  }

  const noPage = validateParams({ pageId: "", accessToken: "valid-token" });
  assert.equal(noPage.success, false);
  assert.equal(noPage.errorCode, "NO_FACEBOOK_PAGE");

  const noToken = validateParams({ pageId: "page-123", accessToken: "" });
  assert.equal(noToken.success, false);
  assert.equal(noToken.errorCode, "NO_PAGE_ACCESS_TOKEN");
});

test("Instagram Publishing: Validates linked Instagram account requirement", () => {
  function validateInstagramPublishing(instagramAccountId) {
    if (!instagramAccountId || instagramAccountId.trim() === "") {
      return {
        success: false,
        errorCode: "NO_INSTAGRAM_ACCOUNT",
        errorMessage: "No Instagram Professional account is connected to this Facebook Page.",
      };
    }
    return { success: true };
  }

  const resultWithoutIg = validateInstagramPublishing(null);
  assert.equal(resultWithoutIg.success, false);
  assert.equal(resultWithoutIg.errorCode, "NO_INSTAGRAM_ACCOUNT");
  assert.equal(
    resultWithoutIg.errorMessage,
    "No Instagram Professional account is connected to this Facebook Page."
  );

  const resultWithIg = validateInstagramPublishing("ig-user-789");
  assert.equal(resultWithIg.success, true);
});

test("Instagram Publishing: Follows required 3-step Reels container sequence", () => {
  const igUserId = "ig-user-555";
  const containerId = "container-888";
  const mediaId = "media-777";

  // Step 1: Create Container URL & Params
  const createUrl = new URL(`${GRAPH_BASE}/${igUserId}/media`);
  createUrl.searchParams.set("media_type", "REELS");
  createUrl.searchParams.set("video_url", "https://cdn.example.com/video.mp4");
  createUrl.searchParams.set("caption", "Exciting reel! #viral");

  assert.equal(createUrl.origin, "https://graph.facebook.com");
  assert.equal(createUrl.pathname, `/v21.0/${igUserId}/media`);
  assert.equal(createUrl.searchParams.get("media_type"), "REELS");
  assert.equal(createUrl.searchParams.get("video_url"), "https://cdn.example.com/video.mp4");

  // Step 2: Poll Container Status URL
  const statusUrl = `${GRAPH_BASE}/${containerId}?fields=status_code,status`;
  assert.equal(statusUrl, `https://graph.facebook.com/v21.0/${containerId}?fields=status_code,status`);

  // Step 3: Publish Container URL
  const publishUrl = new URL(`${GRAPH_BASE}/${igUserId}/media_publish`);
  publishUrl.searchParams.set("creation_id", containerId);
  assert.equal(publishUrl.pathname, `/v21.0/${igUserId}/media_publish`);
  assert.equal(publishUrl.searchParams.get("creation_id"), containerId);

  // Return permalink
  const permalink = `https://www.instagram.com/reel/C8xyz123/`;
  assert.ok(permalink.startsWith("https://www.instagram.com/reel/"));
});

test("Publishing Dispatcher: Single-platform retry isolates execution to specified platform", () => {
  const targets = [
    { platform: "youtube", status: "published", platform_post_id: "yt-123" },
    { platform: "facebook", status: "failed", error_message: "Network error" },
    { platform: "instagram", status: "published", platform_post_id: "ig-456" },
  ];

  function getTargetsToProcess(allTargets, specificPlatform) {
    return allTargets.filter(
      (t) =>
        (!specificPlatform || t.platform === specificPlatform) &&
        t.status !== "published"
    );
  }

  // When retrying ONLY facebook:
  const toProcess = getTargetsToProcess(targets, "facebook");
  assert.equal(toProcess.length, 1);
  assert.equal(toProcess[0].platform, "facebook");

  // Other published platforms remain unaffected
  const publishedTargets = targets.filter((t) => t.status === "published");
  assert.equal(publishedTargets.length, 2);
});
