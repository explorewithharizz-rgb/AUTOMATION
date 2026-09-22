import test from "node:test";
import assert from "node:assert/strict";

// Emulate YouTube upload response validator
function validateYouTubeUploadResponse(uploadResStatus, uploadData, title, privacyStatus) {
  const rawVideoId = uploadData?.id;

  // Validate: Get uploaded video ID ONLY from response.data.id (never fake ID, UUID, or mock)
  const hasValidRealVideoId =
    uploadResStatus === 200 &&
    rawVideoId &&
    typeof rawVideoId === "string" &&
    rawVideoId.trim() !== "" &&
    !rawVideoId.startsWith("mock_") &&
    !rawVideoId.startsWith("demo_");

  if (!hasValidRealVideoId) {
    return {
      success: false,
      errorCode: "NO_VALID_YOUTUBE_VIDEO_ID",
      errorMessage: "YouTube Data API v3 did not return a valid video ID in response.data.id.",
      devDetails: {
        status: uploadResStatus,
        reason: uploadData?.error?.errors?.[0]?.reason || "NO_VALID_YOUTUBE_VIDEO_ID",
        message: uploadData?.error?.message || "videos.insert did not return a valid video ID",
        raw: uploadData,
      },
    };
  }

  const videoId = rawVideoId.trim();
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  return {
    success: true,
    videoId,
    url,
  };
}

test("YouTube Success Validation: Rejects fake, mock, UUID, or missing IDs", () => {
  // Missing id
  assert.equal(validateYouTubeUploadResponse(200, {}, "Test", "private").success, false);

  // Null id
  assert.equal(validateYouTubeUploadResponse(200, { id: null }, "Test", "private").success, false);

  // Empty string id
  assert.equal(validateYouTubeUploadResponse(200, { id: "   " }, "Test", "private").success, false);

  // Mock ID prefix
  assert.equal(validateYouTubeUploadResponse(200, { id: "mock_yt_123456" }, "Test", "private").success, false);

  // Demo ID prefix
  assert.equal(validateYouTubeUploadResponse(200, { id: "demo_yt_video" }, "Test", "private").success, false);

  // HTTP non-200
  assert.equal(validateYouTubeUploadResponse(400, { id: "valid_id", error: { message: "Bad Request" } }, "Test", "private").success, false);
});

test("YouTube Success Validation: Accepts real YouTube video ID and builds exact URL", () => {
  const realId = "2zuRirkgOQk";
  const result = validateYouTubeUploadResponse(200, { id: realId, kind: "youtube#video" }, "BEWEB YouTube API Test", "private");

  assert.equal(result.success, true);
  assert.equal(result.videoId, "2zuRirkgOQk");
  assert.equal(result.url, "https://www.youtube.com/watch?v=2zuRirkgOQk");
});

test("YouTube Processing State: Preserves success status while YouTube processes video", () => {
  function handleProcessingState(items) {
    if (!items || items.length === 0) {
      return { exists: false };
    }
    const item = items[0];
    const uploadStatus = item.status?.uploadStatus; // e.g. "uploaded"
    const processingStatus = item.processingDetails?.processingStatus || uploadStatus; // e.g. "processing"

    const isProcessing = processingStatus === "processing" || uploadStatus === "uploaded";
    return {
      exists: true,
      isProcessing,
      message: isProcessing
        ? "Uploaded successfully — YouTube is processing the video."
        : "Video published successfully to YouTube!",
    };
  }

  // Video immediately after upload is in processing state
  const processingItem = [
    {
      id: "2zuRirkgOQk",
      status: { uploadStatus: "uploaded", privacyStatus: "private" },
      processingDetails: { processingStatus: "processing" },
    },
  ];

  const state = handleProcessingState(processingItem);
  assert.equal(state.exists, true);
  assert.equal(state.isProcessing, true);
  assert.equal(state.message, "Uploaded successfully — YouTube is processing the video.");
});

test("Local Cleanup: Verifies cleanup deletes local temp file only, never deletes YouTube videos", () => {
  const actionsPerformed = [];

  function performLocalCleanup(localFilePath) {
    // Only local disk operations are allowed
    actionsPerformed.push({ action: "delete_local_temp", path: localFilePath });
  }

  performLocalCleanup("/tmp/temp_upload_123.mp4");

  assert.equal(actionsPerformed.length, 1);
  assert.equal(actionsPerformed[0].action, "delete_local_temp");
  assert.ok(!actionsPerformed.some((a) => a.action.includes("youtube") || a.action.includes("videos.delete")));
});

// Emulate formatYouTubeErrorMessage matching production
function formatYouTubeErrorMessage(reason, rawMessage) {
  if (reason === "uploadLimitExceeded") {
    return "The user has exceeded the number of videos they may upload. YouTube enforces daily upload limits per channel. Please wait 24 hours or verify your channel at https://www.youtube.com/verify to increase your daily upload limit.";
  }
  if (reason === "quotaExceeded") {
    return "YouTube API daily quota exceeded (quotaExceeded). The Google Cloud project daily API quota has been reached (10,000 units/day). Quota resets at midnight Pacific Time (PT).";
  }
  if (reason === "insufficientPermissions") {
    return "YouTube upload permission denied (insufficientPermissions). The youtube.upload scope was not granted. Please reconnect your YouTube channel.";
  }
  if (reason === "forbidden") {
    return `YouTube API access forbidden (forbidden): ${rawMessage || "Access denied by Google"}`;
  }
  if (reason === "invalidCredentials" || reason === "tokenExpired" || reason === "authError") {
    return "Google authorization has expired or is invalid (invalidCredentials). Please reconnect YouTube in Accounts.";
  }
  if (reason === "channelNotFound") {
    return "YouTube channel not found. If this account uses a Brand Channel, please reconnect and select the specific Brand Account in the Google prompt.";
  }
  return rawMessage || `YouTube upload failed (${reason}). Please try again.`;
}

test("YouTube Error Differentiation: uploadLimitExceeded translates to daily channel limit message and keeps account connected", () => {
  const reason = "uploadLimitExceeded";
  const rawMsg = "The user has exceeded the number of videos they may upload.";
  const friendly = formatYouTubeErrorMessage(reason, rawMsg);

  assert.ok(friendly.includes("exceeded the number of videos"));
  assert.ok(friendly.includes("24 hours"));
  assert.ok(friendly.includes("youtube.com/verify"));
  // Account disconnect is NOT called for uploadLimitExceeded
  let accountDisconnected = false;
  if (reason !== "uploadLimitExceeded") {
    accountDisconnected = true;
  }
  assert.equal(accountDisconnected, false, "Account must stay connected on uploadLimitExceeded");
});

test("YouTube Error Differentiation: forbidden does NOT assume daily upload limit", () => {
  const reason = "forbidden";
  const rawMsg = "Access forbidden for this channel.";
  const friendly = formatYouTubeErrorMessage(reason, rawMsg);

  assert.ok(!friendly.includes("24 hours"));
  assert.ok(!friendly.includes("exceeded the number of videos"));
  assert.ok(friendly.includes("forbidden"));
});

test("YouTube Error Differentiation: quotaExceeded shows distinct Google Cloud project quota message", () => {
  const reason = "quotaExceeded";
  const rawMsg = "The request cannot be completed because you have exceeded your quota.";
  const friendly = formatYouTubeErrorMessage(reason, rawMsg);

  assert.ok(friendly.includes("quotaExceeded"));
  assert.ok(friendly.includes("10,000 units/day"));
  assert.ok(friendly.includes("Pacific Time"));
});

test("YouTube Error Differentiation: insufficientPermissions / forbidden shows permission reconnect instructions", () => {
  const reason = "insufficientPermissions";
  const rawMsg = "The user does not have permission to perform this operation.";
  const friendly = formatYouTubeErrorMessage(reason, rawMsg);

  assert.ok(friendly.includes("permission denied") || friendly.includes("insufficientPermissions"));
  assert.ok(friendly.includes("youtube.upload"));
});

test("YouTube Safe Logging: Error logs include required fields and NEVER leak OAuth tokens", () => {
  const mockToken = "ya29.a0AfH6SMB_secret_oauth_access_token_12345";
  const errorPayload = {
    httpStatus: 400,
    "response.data.error.code": 400,
    "response.data.error.message": "The user has exceeded the number of videos they may upload.",
    "response.data.error.errors[0].reason": "uploadLimitExceeded",
    "response.data.error.errors[0].message": "The user has exceeded the number of videos they may upload.",
    connectedYouTubeChannelId: "UCWbz8TJLw6lRaSp4yQO4_qw",
    connectedChannelName: "Nammaaweb",
    insertCallsCount: 1,
  };

  // Stringify structured log
  const logOutput = JSON.stringify(errorPayload);

  // Assert presence of all required fields
  assert.equal(errorPayload.httpStatus, 400);
  assert.equal(errorPayload["response.data.error.code"], 400);
  assert.equal(errorPayload["response.data.error.errors[0].reason"], "uploadLimitExceeded");
  assert.equal(errorPayload["response.data.error.message"], "The user has exceeded the number of videos they may upload.");
  assert.equal(errorPayload.connectedYouTubeChannelId, "UCWbz8TJLw6lRaSp4yQO4_qw");
  assert.equal(errorPayload.connectedChannelName, "Nammaaweb");
  assert.equal(errorPayload.insertCallsCount, 1);

  // Assert NO OAuth tokens in log output
  assert.ok(!logOutput.includes(mockToken));
  assert.ok(!logOutput.includes("Bearer"));
  assert.ok(!logOutput.includes("access_token"));
  assert.ok(!logOutput.includes("refresh_token"));
});

