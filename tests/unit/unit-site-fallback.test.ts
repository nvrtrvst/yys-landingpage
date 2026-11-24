import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("@/lib/db", () => {
  const execute = vi.fn();
  return { default: { execute }, getSettings: vi.fn() };
});

import pool from "@/lib/db";
import {
  getUnitAgenda,
  getUnitGallery,
  getUnitNewsDetail,
  getUnitNewsList,
  getUnitSiteData,
  getUnitSiteUnit,
} from "@/components/unit-site/unit-site-data";

const execute = pool.execute as unknown as ReturnType<typeof vi.fn>;

afterEach(() => {
  execute.mockReset();
});

describe("unit site data fallback", () => {
  it("serves a known unit shell when the database is unreachable", async () => {
    execute.mockRejectedValue(new Error("ECONNREFUSED"));

    const unit = await getUnitSiteUnit("sd");
    expect(unit).not.toBeNull();
    expect(unit?.id).toBe(0);
    expect(unit?.slug).toBe("sd");
    expect(unit?.name).toContain("Nuurul Muttaqiin");
  });

  it("returns null for an unknown unit slug", async () => {
    execute.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(getUnitSiteUnit("xyz")).resolves.toBeNull();
  });

  it("serves a known unit shell when the row is missing from the database", async () => {
    execute.mockResolvedValue([[]]);

    const unit = await getUnitSiteUnit("smp");
    expect(unit?.id).toBe(0);
    expect(unit?.slug).toBe("smp");
  });

  it("keeps the site shell with empty sections when the database is unreachable", async () => {
    execute.mockRejectedValue(new Error("ECONNREFUSED"));

    const data = await getUnitSiteData("sd");
    expect(data?.unit.id).toBe(0);
    expect(data?.news).toEqual([]);
    expect(data?.events).toEqual([]);
    expect(data?.programs).toEqual([]);
    expect(data?.faqs).toEqual([]);
  });

  it("does not render a news detail for the fallback unit", async () => {
    execute.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(getUnitNewsDetail("judul-berita", "sd")).resolves.toBeNull();
  });

  it("returns an empty news list for the fallback unit", async () => {
    execute.mockRejectedValue(new Error("ECONNREFUSED"));

    const data = await getUnitNewsList("sd", 1);
    expect(data?.unit.id).toBe(0);
    expect(data?.news).toEqual([]);
    expect(data?.totalPages).toBe(1);
  });

  it("returns an empty agenda for the fallback unit", async () => {
    execute.mockRejectedValue(new Error("ECONNREFUSED"));

    const data = await getUnitAgenda("sd");
    expect(data?.unit.id).toBe(0);
    expect(data?.events).toEqual([]);
  });

  it("returns an empty gallery for the fallback unit", async () => {
    execute.mockRejectedValue(new Error("ECONNREFUSED"));

    const data = await getUnitGallery("sd");
    expect(data?.unit.id).toBe(0);
    expect(data?.galleries).toEqual([]);
  });
});