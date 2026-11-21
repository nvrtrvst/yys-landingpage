import { describe, expect, it, afterEach } from "vitest";
import { foundationUrl, unitSiteOrigin, unitSlugFromHost } from "@/lib/unit-sites";

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

describe("unit site urls", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("derives unit and foundation origins", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://nuurulmuttaqiin.or.id";
    expect(unitSiteOrigin("sd")).toBe("https://sd.nuurulmuttaqiin.or.id");
    expect(foundationUrl()).toBe("https://nuurulmuttaqiin.or.id");
  });
});
