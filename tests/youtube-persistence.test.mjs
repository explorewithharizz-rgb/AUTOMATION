import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const TEST_DATA_DIR = path.join(process.cwd(), ".data-test");
const TEST_FILE = path.join(TEST_DATA_DIR, "youtube_oauth.json");

// Minimal AES-256 helpers matching crypto.ts
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const TEST_KEY = crypto.createHash("sha256").update("test-encryption-key-for-youtube-persistence").digest();

function encryptToken(plainText) {
  if (!plainText) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, TEST_KEY, iv, { authTagLength: AUTH_TAG_LENGTH });
  let enc = cipher.update(plainText, "utf8", "hex");
  enc += cipher.final("hex");
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${enc}`;
}

function decryptToken(payload) {
  if (!payload) return null;
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, TEST_KEY, Buffer.from(ivHex, "hex"), { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let dec = decipher.update(dataHex, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

// Emulate saveYouTubeAccount logic
function simulateSaveYouTubeAccount(storage, {
  userId,
  channelId,
  channelTitle,
  channelAvatarUrl,
  googleEmail,
  googleUserId,
  accessToken,
  refreshToken,
  expiresIn,
  grantedScopes,
}) {
  const existingRecord = storage.find((c) => c.appUserId === userId);

  let finalEncryptedRefreshToken = null;
  if (refreshToken) {
    finalEncryptedRefreshToken = encryptToken(refreshToken);
  } else if (existingRecord && existingRecord.refreshToken) {
    // Preserve existing valid stored refresh token
    finalEncryptedRefreshToken = existingRecord.refreshToken;
  }

  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  const now = new Date().toISOString();

  const newRecord = {
    appUserId: userId,
    googleUserId: googleUserId || existingRecord?.googleUserId || null,
    email: googleEmail || existingRecord?.email || null,
    youtubeChannelId: channelId,
    youtubeChannelName: channelTitle,
    channelProfileImage: channelAvatarUrl || existingRecord?.channelProfileImage || null,
    accessToken: encryptToken(accessToken),
    refreshToken: finalEncryptedRefreshToken,
    accessTokenExpiresAt: tokenExpiresAt,
    grantedScopes: grantedScopes || existingRecord?.grantedScopes || [],
    connectedAt: existingRecord?.connectedAt || now,
    updatedAt: now,
  };

  const filtered = storage.filter((c) => c.appUserId !== userId);
  filtered.push(newRecord);
  return filtered;
}

test("YouTube Persistence: Preserves refresh token when subsequent reconnect returns null", () => {
  let storage = [];

  // 1. Initial connect with refresh token
  storage = simulateSaveYouTubeAccount(storage, {
    userId: "user-1",
    channelId: "UC_Channel_123",
    channelTitle: "Nammaaweb",
    channelAvatarUrl: "https://yt3.ggpht.com/avatar.jpg",
    googleEmail: "creator@example.com",
    googleUserId: "google-uid-1",
    accessToken: "ya29.access_token_1",
    refreshToken: "1//04_refresh_token_secret_xyz",
    expiresIn: 3600,
    grantedScopes: ["openid", "https://www.googleapis.com/auth/youtube.upload"],
  });

  assert.equal(storage.length, 1);
  const initial = storage[0];
  assert.equal(initial.appUserId, "user-1");
  assert.equal(initial.youtubeChannelName, "Nammaaweb");
  assert.ok(initial.refreshToken !== null);
  assert.equal(decryptToken(initial.refreshToken), "1//04_refresh_token_secret_xyz");

  // 2. Reconnect when Google omits refresh_token (standard Google OAuth behavior for re-auth)
  storage = simulateSaveYouTubeAccount(storage, {
    userId: "user-1",
    channelId: "UC_Channel_123",
    channelTitle: "Nammaaweb",
    channelAvatarUrl: "https://yt3.ggpht.com/avatar.jpg",
    googleEmail: "creator@example.com",
    googleUserId: "google-uid-1",
    accessToken: "ya29.access_token_2_new",
    refreshToken: null, // Google did not return a new refresh token
    expiresIn: 3600,
  });

  assert.equal(storage.length, 1);
  const preserved = storage[0];
  // Access token should be updated to new token
  assert.equal(decryptToken(preserved.accessToken), "ya29.access_token_2_new");
  // Refresh token MUST NOT be overwritten with null
  assert.ok(preserved.refreshToken !== null);
  assert.equal(decryptToken(preserved.refreshToken), "1//04_refresh_token_secret_xyz");
});

test("YouTube Persistence: Expiry check identifies expired or near-expiry (<5 min) tokens", () => {
  function isTokenExpired(expiresAtString) {
    const expiresAtMs = expiresAtString ? new Date(expiresAtString).getTime() : 0;
    return expiresAtMs === 0 || Date.now() + 5 * 60 * 1000 > expiresAtMs;
  }

  // Expired 10 minutes ago
  const expiredPast = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  assert.equal(isTokenExpired(expiredPast), true);

  // Expiring in 2 minutes (within 5 minute buffer)
  const expiringSoon = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  assert.equal(isTokenExpired(expiringSoon), true);

  // Expiring in 45 minutes (healthy)
  const healthy = new Date(Date.now() + 45 * 60 * 1000).toISOString();
  assert.equal(isTokenExpired(healthy), false);
});

test("YouTube Persistence: Transient errors preserve connection, only invalid_grant revokes", () => {
  function shouldDisconnectOnRefreshError(error) {
    if (error?.code === "invalid_grant" || error?.message?.includes("invalid_grant")) {
      return true; // Revoked by user in Google Account Security
    }
    return false; // Transient network error / 500 / rate limit -> PRESERVE connection
  }

  // Network timeout / connection reset
  assert.equal(shouldDisconnectOnRefreshError(new Error("ETIMEDOUT: Connection timed out")), false);
  assert.equal(shouldDisconnectOnRefreshError({ code: "ECONNRESET", message: "socket hang up" }), false);
  assert.equal(shouldDisconnectOnRefreshError({ code: 500, message: "Internal server error at oauth2.googleapis.com" }), false);

  // Google Revocation: invalid_grant
  assert.equal(shouldDisconnectOnRefreshError({ code: "invalid_grant", message: "Token has been expired or revoked." }), true);
  assert.equal(shouldDisconnectOnRefreshError(new Error("invalid_grant")), true);
});

test("YouTube Upload Scope: Validates youtube.upload scope presence", () => {
  function checkScope(scopesString) {
    const scopes = scopesString.split(" ");
    return scopes.some(
      (s) =>
        s.includes("youtube.upload") ||
        s.includes("youtube.force-ssl") ||
        s === "https://www.googleapis.com/auth/youtube"
    );
  }

  // Missing youtube.upload scope
  assert.equal(checkScope("openid https://www.googleapis.com/auth/userinfo.email"), false);

  // Granted youtube.upload scope
  assert.equal(
    checkScope("openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.upload"),
    true
  );
});

test("YouTube Upload Payload: Supports Public, Unlisted, Private and Snippet metadata", () => {
  function buildUploadPayload({ title, description, tags, privacyStatus, publishAt }) {
    const statusPayload = { selfDeclaredMadeForKids: false };
    if (publishAt && new Date(publishAt).getTime() > Date.now()) {
      statusPayload.privacyStatus = "private";
      statusPayload.publishAt = new Date(publishAt).toISOString();
    } else {
      statusPayload.privacyStatus = privacyStatus;
    }

    return {
      snippet: {
        title: title.slice(0, 100),
        description: description.slice(0, 5000),
        tags: tags && tags.length > 0 ? tags.slice(0, 50) : undefined,
        categoryId: "22",
      },
      status: statusPayload,
    };
  }

  const payload = buildUploadPayload({
    title: "YouTube API Test",
    description: "Uploaded through BEWEB Social Automation.",
    tags: ["test", "automation", "api"],
    privacyStatus: "private",
    publishAt: null,
  });

  assert.equal(payload.snippet.title, "YouTube API Test");
  assert.equal(payload.snippet.description, "Uploaded through BEWEB Social Automation.");
  assert.deepEqual(payload.snippet.tags, ["test", "automation", "api"]);
  assert.equal(payload.snippet.categoryId, "22");
  assert.equal(payload.status.privacyStatus, "private");
  assert.equal(payload.status.selfDeclaredMadeForKids, false);
});
