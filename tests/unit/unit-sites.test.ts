import { describe, expect, it, afterEach } from "vitest";
import { UNIT_FALLBACK, UNIT_SLUGS, foundationUrl, isKnownUnitSlug, unitSlugFromHost } from "@/lib/unit-sites";

describe("isKnownUnitSlug", () => {
  it("accepts every configured unit slug", () => {
    for (const slug of UNIT_SLUGS) expect(isKnownUnitSlug(slug)).toBe(true);
  });

  it("rejects unknown and case-variant slugs", () => {
    expect(isKnownUnitSlug("xyz")).toBe(false);
    expect(isKnownUnitSlug("SD")).toBe(false);
    expect(isKnownUnitSlug("")).toBe(false);
  });
});

describe("UNIT_FALLBACK", () => {
  it("provides a name and tagline for every unit", () => {
    for (const slug of UNIT_SLUGS) {
      expect(UNIT_FALLBACK[slug].name).toContain("Nuurul Muttaqiin");
      expect(UNIT_FALLBACK[slug].tagline.length).toBeGreaterThan(0);
    }
  });
});

describe("unitSlugFromHost", () => {
  it("maps a known unit subdomain", () => {
    expect(unitSlugFromHost("sd.nuurulmuttaqiin.or.id", "nuurulmuttaqiin.or.id")).toBe("sd");
  });

  it("rejects the root domain and unknown subdomains", () => {
    expect(unitSlugFromHost("nuurulmuttaqiin.or.id", "nuurulmuttaqiin.or.id")).toBeNull();
    expect(unitSlugFromHost("penamaya.nuurulmuttaqiin.or.id", "nuurulmuttaqiin.or.id")).toBeNull();
  });

  it("ignores ports and trailing dots", () => {
    expect(unitSlugFromHost("smp.nuurulmuttaqiin.or.id:5000.", "nuurulmuttaqiin.or.id")).toBe("smp");
  });
});

describe("foundationUrl", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("returns the root origin without a trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://nuurulmuttaqiin.or.id";
    expect(foundationUrl()).toBe("https://nuurulmuttaqiin.or.id");
  });

  it("strips a trailing slash from the configured app url", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://nuurulmuttaqiin.or.id/";
    expect(foundationUrl()).toBe("https://nuurulmuttaqiin.or.id");
  });

  it("falls back to the default root when the env var is invalid", () => {
    process.env.NEXT_PUBLIC_APP_URL = "not a url";
    expect(foundationUrl()).toBe("https://nuurulmuttaqiin.or.id");
  });
});