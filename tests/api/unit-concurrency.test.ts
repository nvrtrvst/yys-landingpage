import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  execute: vi.fn(),
  getConnection: vi.fn(),
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({ requireModuleOrRoles: mocks.requireAccess }));
vi.mock("@/lib/db", () => ({ default: { getConnection: mocks.getConnection } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimitOrThrow: vi.fn(), getClientIp: () => "127.0.0.1" }));
vi.mock("@/lib/revalidate-unit-sites", () => ({ isReservedUnitSlug: () => false, revalidateUnitSites: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { PUT as saveUnit } from "@/app/api/admin/units/[id]/route";
import { PUT as savePpdb } from "@/app/api/admin/units/[id]/ppdb/route";
import { ForbiddenError } from "@/lib/errors";

const initialToken = "2026-11-27 12:00:00.000001";
const nextToken = "2026-11-27 12:00:00.000002";
const payload = { name: "SD Nuurul Muttaqiin", slug: "sd", academic_year: "2026-2027", schedules: [] };

function request(token?: string) {
  return new Request("http://localhost/api/admin/units/3", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, updated_at: token }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAccess.mockResolvedValue({ user: { role: "admin", unit_id: null } });
  let current = initialToken;
  mocks.execute.mockImplementation(async (sql: string, params: unknown[]) => {
    if (sql.includes("FOR UPDATE")) return [params[1] === current ? [{ slug: "sd", status: "active", order_index: 1 }] : [], []];
    if (sql.startsWith("UPDATE")) {
      current = nextToken;
      return [{ affectedRows: 1 }, []];
    }
    return [[{ updated_at: current }], []];
  });
  mocks.getConnection.mockResolvedValue({ ...mocks });
});

describe.each([["unit", saveUnit], ["PPDB", savePpdb]] as const)("%s optimistic locking", (_, save) => {
  it("accepts a fresh token then rejects the stale token without a second write", async () => {
    const first = await save(request(initialToken), { params: Promise.resolve({ id: "3" }) });
    expect(first.status).toBe(200);
    expect((await first.json()).updated_at).toBe(nextToken);
    const second = await save(request(initialToken), { params: Promise.resolve({ id: "3" }) });
    expect(second.status).toBe(409);
    expect(mocks.execute.mock.calls.filter(([sql]) => String(sql).startsWith("UPDATE"))).toHaveLength(1);
    expect(mocks.rollback).toHaveBeenCalledTimes(1);
    expect(mocks.release).toHaveBeenCalledTimes(2);
  });

  it("rejects a missing token before acquiring a connection", async () => {
    const result = await save(request(), { params: Promise.resolve({ id: "3" }) });
    expect(result.status).toBe(409);
    expect(mocks.getConnection).not.toHaveBeenCalled();
  });

  it("returns a migration instruction and rolls back when the schema is incomplete", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.execute.mockRejectedValueOnce(Object.assign(new Error("Unknown column in private SQL"), { code: "ER_BAD_FIELD_ERROR" }));
    const result = await save(request(initialToken), { params: Promise.resolve({ id: "3" }) });
    const body = await result.json();
    expect(result.status).toBe(503);
    expect(body.code).toBe("UNIT_MIGRATION_REQUIRED");
    expect(body.error).toContain("migration_unit_site_settings.sql");
    expect(body.error).not.toContain("private SQL");
    expect(mocks.rollback).toHaveBeenCalledTimes(1);
    expect(mocks.release).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it("forbids an admin_unit from changing another unit", async () => {
    mocks.requireAccess.mockResolvedValue({ user: { role: "admin_unit", unit_id: 4 } });
    const result = await save(request(initialToken), { params: Promise.resolve({ id: "3" }) });
    expect(result.status).toBe(403);
    expect(mocks.getConnection).not.toHaveBeenCalled();
  });

  it("does not access the database if authorization fails", async () => {
    mocks.requireAccess.mockRejectedValue(new ForbiddenError());
    const result = await save(request(initialToken), { params: Promise.resolve({ id: "3" }) });
    expect(result.status).toBe(403);
    expect(mocks.getConnection).not.toHaveBeenCalled();
  });
});
