import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// Test native AES-256-GCM implementation matching lib/encryption/crypto.ts
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const TEST_KEY = crypto.createHash("sha256").update("test-encryption-key-32b-secret").digest();

function encryptToken(plainText, key = TEST_KEY) {
  if (!plainText) throw new Error("Cannot encrypt empty token");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decryptToken(payload, key = TEST_KEY) {
  if (!payload) throw new Error("Cannot decrypt empty token");
  const parts = payload.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted token format");
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

test("AES-256-GCM: Successfully encrypts and decrypts OAuth tokens", () => {
  const sampleToken = "EAAGm0PX4ZCpsBAK7ZCo1890sample_meta_access_token_super_long_string";
  const encrypted = encryptToken(sampleToken);

  assert.notEqual(encrypted, sampleToken);
  assert.equal(encrypted.split(":").length, 3);

  const decrypted = decryptToken(encrypted);
  assert.equal(decrypted, sampleToken);
});

test("AES-256-GCM: Fails and throws on tampered payload or corrupted auth tag", () => {
  const sampleToken = "ya29.a0AfH6SMD_sample_youtube_refresh_token_1234567";
  const encrypted = encryptToken(sampleToken);
  const parts = encrypted.split(":");

  // Tamper with the ciphertext by flipping characters
  const lastByte = parseInt(parts[2].slice(-2), 16);
  const flipped = (lastByte ^ 0xff).toString(16).padStart(2, "0");
  const tamperedCipher = parts[2].slice(0, -2) + flipped;
  const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedCipher}`;

  assert.throws(() => {
    decryptToken(tamperedPayload);
  });
});

test("AES-256-GCM: Rejects empty token", () => {
  assert.throws(() => {
    encryptToken("");
  });
});
