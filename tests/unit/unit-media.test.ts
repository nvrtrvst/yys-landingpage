import { describe, expect, it } from "vitest";
import { parseCarouselImages, safeMapEmbedUrl, youtubeEmbedUrl, youtubeWatchUrl } from "@/lib/unit-media";

describe("parseCarouselImages", () => {
  it("parses JSON and filters unsafe values", () => {
    expect(parseCarouselImages('["/uploads/a.webp","https://x.test/b.jpg","javascript:alert(1)"]')).toEqual([
      "/uploads/a.webp",
      "https://x.test/b.jpg",
    ]);
  });

  it("returns empty for invalid input", () => {
    expect(parseCarouselImages("not-json")).toEqual([]);
    expect(parseCarouselImages(null)).toEqual([]);
  });
});

describe("youtubeEmbedUrl", () => {
  it("normalizes watch and short links", () => {
    expect(youtubeEmbedUrl("https://youtube.com/watch?v=abcdefghijk")).toBe("https://www.youtube-nocookie.com/embed/abcdefghijk");
    expect(youtubeEmbedUrl("https://youtu.be/abcdefghijk")).toBe("https://www.youtube-nocookie.com/embed/abcdefghijk");
  });

  it("rejects invalid links", () => {
    expect(youtubeEmbedUrl("https://example.com/video")).toBeNull();
  });

  it("provides a watch fallback", () => {
    expect(youtubeWatchUrl("https://youtu.be/abcdefghijk")).toBe("https://www.youtube.com/watch?v=abcdefghijk");
  });
});

describe("safeMapEmbedUrl", () => {
  it("keeps valid Google Maps embeds", () => {
    const url = "https://www.google.com/maps/embed?pb=test";
    expect(safeMapEmbedUrl(url, null)).toBe(url);
  });

  it("falls back to address query", () => {
    expect(safeMapEmbedUrl("https://evil.test/maps", "Jalan Test")).toContain("maps.google.com/maps?q=Jalan%20Test");
  });
});
