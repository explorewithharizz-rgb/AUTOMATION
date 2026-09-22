import test from "node:test";
import assert from "node:assert/strict";

const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

function getRedirectUri(customRedirectUri, envRedirect, appUrl) {
  if (customRedirectUri) return customRedirectUri;
  if (envRedirect) return envRedirect;
  return `${appUrl || "http://localhost:3000"}/api/auth/youtube/callback`;
}

function getGoogleAuthUrl({ clientId, redirectUri, state }) {
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "select_account consent",
    include_granted_scopes: "true",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

test("YouTube OAuth: Builds authorization URL with required scopes", () => {
  const url = getGoogleAuthUrl({
    clientId: "test-client-id.apps.googleusercontent.com",
    redirectUri: "http://localhost:3000/api/auth/youtube/callback",
    state: "test-state-123",
  });

  const parsed = new URL(url);
  assert.equal(parsed.hostname, "accounts.google.com");
  assert.equal(parsed.pathname, "/o/oauth2/v2/auth");
  assert.equal(parsed.searchParams.get("client_id"), "test-client-id.apps.googleusercontent.com");
  assert.equal(parsed.searchParams.get("redirect_uri"), "http://localhost:3000/api/auth/youtube/callback");
  assert.equal(parsed.searchParams.get("response_type"), "code");
  assert.equal(parsed.searchParams.get("access_type"), "offline");
  assert.equal(parsed.searchParams.get("prompt"), "select_account consent");
  assert.equal(parsed.searchParams.get("state"), "test-state-123");


  // Scopes verification
  const scopeParam = parsed.searchParams.get("scope");
  assert.ok(scopeParam.includes("openid"));
  assert.ok(scopeParam.includes("userinfo.email"));
  assert.ok(scopeParam.includes("userinfo.profile"));
  assert.ok(scopeParam.includes("youtube.upload"));
});

test("YouTube OAuth: Supports custom production and localhost redirect URIs", () => {
  const localUri = getRedirectUri(undefined, undefined, "http://localhost:3000");
  assert.equal(localUri, "http://localhost:3000/api/auth/youtube/callback");

  const prodUri = getRedirectUri("https://my-domain.com/api/auth/youtube/callback", undefined, undefined);
  assert.equal(prodUri, "https://my-domain.com/api/auth/youtube/callback");

  const envUri = getRedirectUri(undefined, "https://prod.app/api/auth/youtube/callback", undefined);
  assert.equal(envUri, "https://prod.app/api/auth/youtube/callback");
});

test("YouTube Upload Scheduling: Enforces private privacyStatus when publishAt is set", () => {
  function prepareStatus(privacyStatus, publishAt) {
    const statusPayload = { selfDeclaredMadeForKids: false };
    if (publishAt && new Date(publishAt).getTime() > Date.now()) {
      statusPayload.privacyStatus = "private";
      statusPayload.publishAt = new Date(publishAt).toISOString();
    } else {
      statusPayload.privacyStatus = privacyStatus;
    }
    return statusPayload;
  }

  // Future scheduled post
  const futureDate = new Date(Date.now() + 86400000).toISOString();
  const scheduled = prepareStatus("public", futureDate);
  assert.equal(scheduled.privacyStatus, "private");
  assert.equal(scheduled.publishAt, futureDate);

  // Immediate public post
  const immediate = prepareStatus("public", null);
  assert.equal(immediate.privacyStatus, "public");
  assert.equal(immediate.publishAt, undefined);
});
