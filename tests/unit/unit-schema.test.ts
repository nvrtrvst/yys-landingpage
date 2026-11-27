import { describe, expect, it } from "vitest";
import { unitSchema } from "@/lib/unit-admin";

const base = { name: "SD Nuurul Muttaqiin", slug: "sd" };

describe("unitSchema hero and OG fields", () => {
  it("accepts upload paths and http(s) URLs", () => {
    expect(unitSchema.safeParse({ ...base, og_image: "/uploads/og.png" }).success).toBe(true);
    expect(unitSchema.safeParse({ ...base, og_image: "https://example.com/og.png" }).success).toBe(true);
  });

  it("rejects non-URL and script schemes", () => {
    expect(unitSchema.safeParse({ ...base, og_image: "javascript:alert(1)" }).success).toBe(false);
    expect(unitSchema.safeParse({ ...base, og_image: "data:image/png;base64,AAAA" }).success).toBe(false);
    expect(unitSchema.safeParse({ ...base, og_image: "og.png" }).success).toBe(false);
    expect(unitSchema.safeParse({ ...base, og_image: "/uploads/../../scp" }).success).toBe(false);
    expect(unitSchema.safeParse({ ...base, og_image: "https://user:pass@example.com/og.png" }).success).toBe(false);
  });

  it("caps hero text length", () => {
    expect(unitSchema.safeParse({ ...base, hero_title: "a".repeat(120) }).success).toBe(true);
    expect(unitSchema.safeParse({ ...base, hero_title: "a".repeat(121) }).success).toBe(false);
    expect(unitSchema.safeParse({ ...base, hero_subtitle: "a".repeat(301) }).success).toBe(false);
  });
});
