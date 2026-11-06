import { describe, expect, it } from "vitest";
import { findActiveHref } from "@/lib/sidebar-nav";

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
