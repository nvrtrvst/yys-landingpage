import { describe, expect, it } from "vitest";
import { findActiveHref } from "@/lib/sidebar-nav";
import { parseUnitId, parseUnitTab, unitTabHref } from "@/lib/unit-navigation";

const hrefs = ["/scp", "/scp/ppdb", "/scp/ppdb/settings", "/scp/mading", "/scp/mading/posts", "/scp/news"];

describe("findActiveHref", () => {
  it("matches the dashboard only on its exact path", () => {
    expect(findActiveHref("/scp", hrefs)).toBe("/scp");
  });

  it("prefers the settings path over its parent", () => {
    expect(findActiveHref("/scp/ppdb/settings", hrefs)).toBe("/scp/ppdb/settings");
  });

  it("falls back to the parent for detail paths", () => {
    expect(findActiveHref("/scp/ppdb/123", hrefs)).toBe("/scp/ppdb");
  });

  it("prefers the posts path over the mading dashboard", () => {
    expect(findActiveHref("/scp/mading/posts", hrefs)).toBe("/scp/mading/posts");
  });

  it("returns null for unknown paths", () => {
    expect(findActiveHref("/scp/unknown", hrefs)).toBeNull();
  });
});

describe("unit tab navigation", () => {
  const unitHrefs = ["/scp/units", "/scp/units?tab=programs", "/scp/units?tab=media", "/scp/units?tab=ppdb"];

  it("highlights only the tab named in the URL", () => {
    expect(findActiveHref("/scp/units", unitHrefs, "")).toBe("/scp/units");
    expect(findActiveHref("/scp/units", unitHrefs, "tab=media")).toBe("/scp/units?tab=media");
    expect(findActiveHref("/scp/units", unitHrefs, "tab=ppdb")).toBe("/scp/units?tab=ppdb");
  });

  it("falls back to the identity tab for unknown or empty tab values", () => {
    expect(findActiveHref("/scp/units", unitHrefs, "tab=unknown")).toBe("/scp/units");
  });

  it("builds hrefs without the default tab", () => {
    expect(unitTabHref("units")).toBe("/scp/units");
    expect(unitTabHref("media")).toBe("/scp/units?tab=media");
    expect(unitTabHref("ppdb", 3)).toBe("/scp/units?tab=ppdb&unit=3");
  });

  it("rejects unsafe unit ids", () => {
    expect(parseUnitId("3")).toBe(3);
    expect(parseUnitId("0")).toBeNull();
    expect(parseUnitId("-1")).toBeNull();
    expect(parseUnitId("3abc")).toBeNull();
    expect(unitTabHref("media", -1)).toBe("/scp/units?tab=media");
  });

  it("normalises unknown tabs to units", () => {
    expect(parseUnitTab(undefined)).toBe("units");
    expect(parseUnitTab("nope")).toBe("units");
    expect(parseUnitTab("ppdb")).toBe("ppdb");
  });
});