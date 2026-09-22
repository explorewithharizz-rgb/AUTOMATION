import test from "node:test";
import assert from "node:assert/strict";

function localToUtcIso(dateStr, timeStr, timezone) {
  try {
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    const targetDate = new Date(dateTimeStr);
    const invDate = new Date(
      targetDate.toLocaleString("en-US", { timeZone: timezone })
    );
    const diff = targetDate.getTime() - invDate.getTime();
    return new Date(targetDate.getTime() + diff).toISOString();
  } catch {
    return new Date(`${dateStr}T${timeStr}:00Z`).toISOString();
  }
}

test("Timezone: Converts UTC date directly without distortion", () => {
  const utcIso = localToUtcIso("2026-10-15", "14:30", "UTC");
  assert.equal(utcIso, "2026-10-15T14:30:00.000Z");
});

test("Timezone: Computes valid ISO string for regional timezone", () => {
  const istIso = localToUtcIso("2026-10-15", "14:30", "Asia/Kolkata");
  assert.ok(istIso.endsWith("Z"));
  // IST is UTC+5:30, so 14:30 IST is 09:00 UTC
  assert.equal(istIso, "2026-10-15T09:00:00.000Z");
});
