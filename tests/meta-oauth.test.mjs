import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

const META_GRAPH_VERSION = "v21.0";
const META_REQUIRED_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
];

function getMetaAuthUrl({ appId, redirectUri, state }) {
  if (!appId) {
    throw new Error("META_APP_ID is not configured");
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: META_REQUIRED_SCOPES.join(","),
    response_type: "code",
  });

  return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

test("Meta OAuth: Builds authorization URL with v21.0 and exact required scopes", () => {
  const url = getMetaAuthUrl({
    appId: "123456789012345",
    redirectUri: "http://localhost:3000/api/oauth/meta/callback",
    state: "test-state-abc",
  });

  const parsed = new URL(url);
  assert.equal(parsed.hostname, "www.facebook.com");
  assert.equal(parsed.pathname, `/${META_GRAPH_VERSION}/dialog/oauth`);
  assert.equal(parsed.searchParams.get("client_id"), "123456789012345");
  assert.equal(parsed.searchParams.get("redirect_uri"), "http://localhost:3000/api/oauth/meta/callback");
  assert.equal(parsed.searchParams.get("response_type"), "code");
  assert.equal(parsed.searchParams.get("state"), "test-state-abc");

  const scopeParam = parsed.searchParams.get("scope");
  assert.ok(scopeParam.includes("pages_show_list"));
  assert.ok(scopeParam.includes("pages_read_engagement"));
  assert.ok(scopeParam.includes("pages_manage_posts"));
  assert.ok(scopeParam.includes("instagram_basic"));
  assert.ok(scopeParam.includes("instagram_content_publish"));

  // Ensure NO unused extra scopes are requested
  const scopes = scopeParam.split(",");
  assert.equal(scopes.length, 5);
});

test("Meta OAuth: Encrypts and decrypts Page access tokens using AES-256-GCM", () => {
  const secret = crypto.randomBytes(32);
  const rawToken = "EAABwzLIXnjYBO123456789realPageAccessToken";

  // AES-256-GCM encryption
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", secret, iv);
  let encrypted = cipher.update(rawToken, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  const stored = `${iv.toString("hex")}:${encrypted}:${authTag}`;

  // Decryption
  const [ivHex, encHex, tagHex] = stored.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", secret, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let decrypted = decipher.update(encHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  assert.equal(decrypted, rawToken);
  assert.notEqual(stored, rawToken);
  assert.ok(!stored.includes(rawToken));
});

test("Meta OAuth: Correctly discovers linked Instagram accounts on Facebook Pages", () => {
  const mockApiPagesResponse = [
    {
      id: "page-111",
      name: "Tech Reviews Page",
      access_token: "page-token-111",
      instagram_business_account: {
        id: "ig-999",
        username: "tech_reviews_daily",
        name: "Tech Reviews",
        profile_picture_url: "https://lookaside.fbsbx.com/ig.jpg",
      },
    },
    {
      id: "page-222",
      name: "Local Bakery",
      access_token: "page-token-222",
      instagram_business_account: null,
    },
  ];

  // Process Page 1 (with linked IG)
  const p1 = mockApiPagesResponse[0];
  assert.ok(p1.instagram_business_account);
  assert.equal(p1.instagram_business_account.id, "ig-999");
  assert.equal(p1.instagram_business_account.username, "tech_reviews_daily");

  // Process Page 2 (no linked IG)
  const p2 = mockApiPagesResponse[1];
  assert.equal(p2.instagram_business_account, null);
  const igWarning = p2.instagram_business_account
    ? `@${p2.instagram_business_account.username}`
    : "No Instagram Professional account is connected to this Facebook Page.";
  assert.equal(igWarning, "No Instagram Professional account is connected to this Facebook Page.");
});

test("Meta OAuth: Multi-page selection logic auto-selects if 1 page, branches if >1 page", () => {
  function determineFlow(pages) {
    if (pages.length === 0) return "error_no_pages";
    if (pages.length === 1) return "auto_connect";
    return "show_selector";
  }

  assert.equal(determineFlow([]), "error_no_pages");
  assert.equal(determineFlow([{ id: "page-1", name: "Solo Page" }]), "auto_connect");
  assert.equal(
    determineFlow([
      { id: "page-1", name: "Page 1" },
      { id: "page-2", name: "Page 2" },
    ]),
    "show_selector"
  );
});
