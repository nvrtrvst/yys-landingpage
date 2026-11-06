import { describe, expect, it } from "vitest";
import {
  firstAccessibleHref,
  hasModuleAccess,
  moduleForApiPath,
  moduleForPath,
  sanitizePetugasPermissions,
} from "@/lib/modules";

describe("hasModuleAccess", () => {
  it("lets admins through", () => {
    expect(hasModuleAccess("admin", [], "backup")).toBe(true);
  });

  it("checks permissions for petugas", () => {
    expect(hasModuleAccess("petugas", ["news"], "news")).toBe(true);
    expect(hasModuleAccess("petugas", ["news"], "gallery")).toBe(false);
  });

  it("requires ppdb_data for the dashboard", () => {
    expect(hasModuleAccess("petugas", ["dashboard"], "dashboard")).toBe(false);
    expect(hasModuleAccess("petugas", ["dashboard", "ppdb_data"], "dashboard")).toBe(true);
  });

  it("always allows profile", () => {
    expect(hasModuleAccess("petugas", [], "profile")).toBe(true);
  });

  it("leaves legacy roles to their role rules", () => {
    expect(hasModuleAccess("editor", [], "news")).toBe(true);
  });
});

describe("moduleForPath", () => {
  it("maps the dashboard exactly", () => {
    expect(moduleForPath("/scp")).toBe("dashboard");
  });

  it("prefers the more specific ppdb path", () => {
    expect(moduleForPath("/scp/ppdb/settings")).toBe("ppdb_settings");
  });

  it("falls back to the parent for detail paths", () => {
    expect(moduleForPath("/scp/ppdb/123")).toBe("ppdb_data");
  });

  it("maps mading posts", () => {
    expect(moduleForPath("/scp/mading/posts")).toBe("mading_posts");
  });

  it("maps print kelulusan to ppdb data", () => {
    expect(moduleForPath("/scp/print-kelulusan")).toBe("ppdb_data");
  });

  it("returns null for unknown paths", () => {
    expect(moduleForPath("/scp/unknown")).toBeNull();
  });
});

describe("moduleForApiPath", () => {
  it("maps ppdb subroutes", () => {
    expect(moduleForApiPath("/api/admin/ppdb/5/sync")).toBe("ppdb_data");
  });

  it("returns null for sensitive modules", () => {
    expect(moduleForApiPath("/api/admin/users")).toBeNull();
  });
});

describe("firstAccessibleHref", () => {
  it("returns the first granted module", () => {
    expect(firstAccessibleHref("petugas", ["news"])).toBe("/scp/news");
  });

  it("returns null when nothing is granted", () => {
    expect(firstAccessibleHref("petugas", [])).toBeNull();
  });

  it("ignores dashboard without ppdb data", () => {
    expect(firstAccessibleHref("petugas", ["dashboard"])).toBeNull();
    expect(firstAccessibleHref("petugas", ["dashboard", "ppdb_data"])).toBe("/scp");
  });

  it("sends admins to the dashboard", () => {
    expect(firstAccessibleHref("admin", [])).toBe("/scp");
  });
});

describe("sanitizePetugasPermissions", () => {
  it("drops sensitive and unknown keys", () => {
    expect(sanitizePetugasPermissions(["news", "users", "backup", "mading_posts", "x"])).toEqual(["news"]);
  });

  it("drops dashboard without ppdb data", () => {
    expect(sanitizePetugasPermissions(["dashboard"])).toEqual([]);
    expect(sanitizePetugasPermissions(["dashboard", "ppdb_data"])).toEqual(["dashboard", "ppdb_data"]);
  });
});
