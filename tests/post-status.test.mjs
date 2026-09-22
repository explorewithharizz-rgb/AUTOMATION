import test from "node:test";
import assert from "node:assert/strict";

function calculateAggregatePostStatus(targetStatuses) {
  if (targetStatuses.length === 0) return "draft";

  const allPublished = targetStatuses.every((s) => s === "published");
  if (allPublished) return "completed";

  const allFailed = targetStatuses.every((s) => s === "failed");
  if (allFailed) return "failed";

  const hasInFlight = targetStatuses.some(
    (s) => s === "uploading" || s === "processing"
  );
  if (hasInFlight) return "publishing";

  const allQueued = targetStatuses.every((s) => s === "queued");
  if (allQueued) return "queued";

  const hasPublished = targetStatuses.some((s) => s === "published");
  const hasFailed = targetStatuses.some((s) => s === "failed");

  if (hasPublished && hasFailed) return "partial";

  return "publishing";
}

test("Post Status: All targets published -> completed", () => {
  assert.equal(
    calculateAggregatePostStatus(["published", "published", "published"]),
    "completed"
  );
});

test("Post Status: Some published, some failed -> partial", () => {
  assert.equal(
    calculateAggregatePostStatus(["published", "published", "failed"]),
    "partial"
  );
});

test("Post Status: All failed -> failed", () => {
  assert.equal(
    calculateAggregatePostStatus(["failed", "failed", "failed"]),
    "failed"
  );
});

test("Post Status: Any uploading or processing -> publishing", () => {
  assert.equal(
    calculateAggregatePostStatus(["published", "uploading", "queued"]),
    "publishing"
  );
  assert.equal(
    calculateAggregatePostStatus(["published", "processing", "published"]),
    "publishing"
  );
});

test("Post Status: All queued -> queued", () => {
  assert.equal(
    calculateAggregatePostStatus(["queued", "queued", "queued"]),
    "queued"
  );
});

test("Retry Platform Isolation: Retrying YouTube filters only failed YouTube target and preserves published targets", () => {
  const post = {
    id: "post-123",
    targets: [
      { id: "t-ig", platform: "instagram", status: "published" },
      { id: "t-fb", platform: "facebook", status: "published" },
      { id: "t-yt", platform: "youtube", status: "failed" },
    ],
  };

  const requestedPlatform = "youtube";
  const eligibleTargets = post.targets.filter(
    (t) => t.status !== "published" && (!requestedPlatform || t.platform === requestedPlatform)
  );

  assert.equal(eligibleTargets.length, 1);
  assert.equal(eligibleTargets[0].platform, "youtube");
  assert.equal(eligibleTargets[0].id, "t-yt");

  // Instagram and Facebook targets remain untouched
  const igTarget = post.targets.find((t) => t.platform === "instagram");
  const fbTarget = post.targets.find((t) => t.platform === "facebook");
  assert.equal(igTarget.status, "published");
  assert.equal(fbTarget.status, "published");
});

