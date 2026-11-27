import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError, ForbiddenError, RateLimitError } from "@/lib/errors";
import { handleUnitAdminError, unitValidationResponse } from "@/lib/unit-admin-errors";

beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); });

describe("unit admin error messages", () => {
  it.each([
    ["ER_BAD_FIELD_ERROR", 503, "UNIT_MIGRATION_REQUIRED", "migration_unit_site_settings.sql"],
    ["ECONNREFUSED", 503, "UNIT_DATABASE_UNAVAILABLE", "koneksi database"],
    ["ER_DUP_ENTRY", 400, "UNIT_SLUG_USED", "Pilih slug lain"],
    ["ER_LOCK_DEADLOCK", 409, "UNIT_SAVE_BUSY", "proses lain"],
    ["ER_DATA_TOO_LONG", 400, "UNIT_FIELD_TOO_LONG", "Perpendek"],
  ])("maps %s to an actionable message without raw diagnostics", async (code, status, errorCode, text) => {
    const error = Object.assign(new Error("secret password, SELECT * FROM units, 10.0.0.1"), { code });
    const response = handleUnitAdminError(error);
    const body = await response.json();
    expect(response.status).toBe(status);
    expect(body.code).toBe(errorCode);
    expect(body.error).toContain(text);
    expect(JSON.stringify(body)).not.toMatch(/password|SELECT|10\.0\.0\.1/);
  });

  it("gives a support code for unexpected errors", async () => {
    const response = handleUnitAdminError(new Error("SQL error and credentials"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(expect.objectContaining({ code: "UNIT_REQUEST_FAILED", error: expect.stringContaining("administrator server") }));
  });

  it.each([[new AuthenticationError(), 401], [new ForbiddenError(), 403], [new RateLimitError(), 429]])("preserves authorization and throttling statuses", (error, status) => {
    expect(handleUnitAdminError(error).status).toBe(status);
  });

  it("explains how to correct invalid hero fields without exposing issue internals", async () => {
    const response = unitValidationResponse([{ path: ["hero_title"], message: "raw internal info" }]);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("120 karakter");
    expect(body.fields).toEqual(["Judul Hero"]);
    expect(body.error).not.toContain("raw internal info");
  });
});
