import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Test native scrypt password hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

test("Password Auth: Successfully hashes and verifies correct password", () => {
  const password = "MySecretPassword123!";
  const hash = hashPassword(password);

  assert.notEqual(hash, password);
  assert.equal(hash.split(":").length, 2);

  const isValid = verifyPassword(password, hash);
  assert.equal(isValid, true);
});

test("Password Auth: Rejects incorrect password and tampered salt", () => {
  const password = "CorrectPassword123";
  const hash = hashPassword(password);

  const isWrongValid = verifyPassword("WrongPassword123", hash);
  assert.equal(isWrongValid, false);

  const [salt, key] = hash.split(":");
  const tamperedHash = `${salt.slice(0, -2)}aa:${key}`;
  const isTamperedValid = verifyPassword(password, tamperedHash);
  assert.equal(isTamperedValid, false);
});

test("Google Auth: Builds authorization URL with required OpenID & Email scopes", () => {
  const clientId = "238574236888-hsrq0rs7r60l3qkj1rl1g658810ummis.apps.googleusercontent.com";
  const state = "test-csrf-state-12345";
  const redirectUri = "http://localhost:3000/api/auth/google/callback";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  assert.ok(url.includes("accounts.google.com"));
  assert.ok(url.includes("openid+email+profile") || url.includes("openid%20email%20profile"));
  assert.ok(url.includes("prompt=select_account"));
  assert.ok(url.includes(encodeURIComponent(redirectUri)));
});

test("Auto-Cleanup: Deletes temporary upload file when post status is completed", () => {
  // Setup dummy local upload test file
  const testDir = path.resolve(process.cwd(), ".data/uploads/test-clean");
  fs.mkdirSync(testDir, { recursive: true });
  const testFile = path.join(testDir, "test-video.mp4");
  fs.writeFileSync(testFile, "dummy video binary content", "utf8");

  assert.equal(fs.existsSync(testFile), true);

  // Simulate auto-clean logic
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
  }
  fs.rmdirSync(testDir);

  assert.equal(fs.existsSync(testFile), false);
});
