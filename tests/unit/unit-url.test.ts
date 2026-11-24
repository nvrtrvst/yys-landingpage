import { describe, expect, it } from "vitest";
import { unitNewsUrl, unitUrl } from "@/lib/unit-sites";
import { unitLogoUrl } from "@/lib/unit-logo";

describe("unitUrl", () => {
  it("builds unit paths without duplicate slashes", () => {
    expect(unitUrl("sd")).toBe("/sd");
    expect(unitUrl("sd", "/")).toBe("/sd");
    expect(unitUrl("sd", "/berita")).toBe("/sd/berita");
    expect(unitUrl("sd", "berita")).toBe("/sd/berita");
  });

  it("builds news paths", () => {
    expect(unitNewsUrl("sd", "juara-olahraga")).toBe("/sd/berita/juara-olahraga");
  });
});

describe("unitLogoUrl", () => {
  it("prefers the unit logo", () => {
    expect(unitLogoUrl({ logo_url: "/uploads/sd-logo.png" }, "/uploads/foundation.png")).toBe("/uploads/sd-logo.png");
  });

  it("falls back to the foundation logo when the unit logo is a dummy or missing", () => {
    expect(unitLogoUrl({ logo_url: "/uploads/dummy/unit_sd.png" }, "/uploads/foundation.png")).toBe("/uploads/foundation.png");
    expect(unitLogoUrl({ logo_url: null }, "/uploads/foundation.png")).toBe("/uploads/foundation.png");
  });

  it("falls back to the static logo when nothing is uploaded", () => {
    expect(unitLogoUrl({ logo_url: null }, null)).toBe("/logo.png");
  });
});