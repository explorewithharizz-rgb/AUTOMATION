import test from "node:test";
import assert from "node:assert/strict";

const MAX_YOUTUBE_TITLE_LENGTH = 100;

function generateYouTubeTitle(customTitle, caption) {
  if (customTitle && customTitle.trim().length > 0) {
    const trimmed = customTitle.trim();
    if (trimmed.length <= MAX_YOUTUBE_TITLE_LENGTH) {
      return trimmed;
    }
    return truncateAtWord(trimmed, MAX_YOUTUBE_TITLE_LENGTH);
  }

  const cleaned = caption
    .split("\n")[0]
    .replace(/[#@][a-zA-Z0-9_]+/g, "")
    .trim();

  const titleSource = cleaned.length > 0 ? cleaned : "New Video";

  if (titleSource.length <= MAX_YOUTUBE_TITLE_LENGTH) {
    return titleSource;
  }

  return truncateAtWord(titleSource, MAX_YOUTUBE_TITLE_LENGTH);
}

function truncateAtWord(text, maxLength) {
  if (text.length <= maxLength) return text;
  const sub = text.slice(0, maxLength - 3);
  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace > 10) {
    return sub.slice(0, lastSpace).trim() + "...";
  }
  return sub.trim() + "...";
}

test("YouTube Title: Uses custom title when provided", () => {
  const title = generateYouTubeTitle("My Awesome Video", "Caption here");
  assert.equal(title, "My Awesome Video");
});

test("YouTube Title: Safely truncates titles longer than 100 characters at word boundary", () => {
  const longCaption =
    "This is a remarkably long caption that has tons and tons of words and details explaining every single nuance of the revolutionary product announcement that is breaking the internet today!";
  const title = generateYouTubeTitle(null, longCaption);

  assert.ok(title.length <= 100);
  assert.ok(title.endsWith("..."));
});

test("YouTube Title: Strips hashtags and mentions from caption line", () => {
  const captionWithTags = "Check out our newest feature! #viral #buildinpublic @postflow";
  const title = generateYouTubeTitle(null, captionWithTags);

  assert.equal(title, "Check out our newest feature!");
});

function resolveYouTubeTitle({ youtubeTitle, title, caption, filename }) {
  if (youtubeTitle && youtubeTitle.trim().length > 0) {
    return youtubeTitle.trim().slice(0, 100);
  }
  if (title && title.trim().length > 0) {
    return title.trim().slice(0, 100);
  }
  if (caption && caption.trim().length > 0) {
    const firstLine = caption.split("\n")[0].trim();
    const clean = firstLine.replace(/#[a-zA-Z0-9_]+/g, "").trim();
    if (clean.length > 0) {
      return clean.slice(0, 100);
    }
    return caption.trim().slice(0, 100);
  }
  if (filename && filename.trim().length > 0) {
    const base = filename.replace(/\.[^/.]+$/, "").trim();
    if (base.length > 0) {
      return base.slice(0, 100);
    }
  }
  return "BEWEB Video Upload";
}

test("Title Resolution Priority: Priority 1 - user entered youtubeTitle", () => {
  const title = resolveYouTubeTitle({
    youtubeTitle: "BEWEB Test",
    caption: "Caption fallback",
    filename: "video.mp4",
  });
  assert.equal(title, "BEWEB Test");
});

test("Title Resolution Priority: Priority 2 - caption when youtubeTitle is missing", () => {
  const title = resolveYouTubeTitle({
    youtubeTitle: "",
    caption: "Test upload from BEWEB Social Automation #trending",
    filename: "video.mp4",
  });
  assert.equal(title, "Test upload from BEWEB Social Automation");
});

test("Title Resolution Priority: Priority 3 - original video filename when no title or caption", () => {
  const title = resolveYouTubeTitle({
    youtubeTitle: "",
    caption: "",
    filename: "BEWEB_Promo_2026.mp4",
  });
  assert.equal(title, "BEWEB_Promo_2026");
});

test("Title Resolution Priority: Priority 4 - fallback never sends empty title", () => {
  const title = resolveYouTubeTitle({
    youtubeTitle: "",
    caption: "",
    filename: "",
  });
  assert.equal(title, "BEWEB Video Upload");
  assert.ok(title.length > 0);
});

