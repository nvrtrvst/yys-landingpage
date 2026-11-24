import { NextResponse } from "next/server";
import { ForbiddenError, handleApiError } from "@/lib/errors";
import pool from "@/lib/db";
import { requireModuleOrRoles } from "@/lib/api-auth";
import { revalidateUnitSites } from "@/lib/revalidate-unit-sites";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";
import { parsePpdbConfig } from "@/lib/ppdb-config";
import { rateLimitOrThrow, getClientIp } from "@/lib/rate-limit";

async function assertUnitAccess(id: string) {
  const session = await requireModuleOrRoles("units", ["superadmin", "admin", "admin_unit"]);
  if (session.user.role === "admin_unit") {
    if (!session.user.unit_id || session.user.unit_id !== Number(id)) throw new ForbiddenError("Dilarang");
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    await assertUnitAccess(id);
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT ppdb_config FROM units WHERE id = ?", [id]);
    if (rows.length === 0) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ config: parsePpdbConfig(rows[0].ppdb_config) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    await assertUnitAccess(id);
    rateLimitOrThrow(`admin:unit-ppdb:${getClientIp(request)}`, 20, 60 * 1000);

    const config = parsePpdbConfig(await request.json());
    if (!config) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const [existing] = await pool.execute<RowDataPacket[]>("SELECT slug FROM units WHERE id = ?", [id]);
    if (existing.length === 0) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    await pool.execute("UPDATE units SET ppdb_config = ? WHERE id = ?", [JSON.stringify(config), id]);
    await revalidateUnitSites([String(existing[0].slug)]);
    revalidatePath("/ppdb");
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return handleApiError(error);
  }
}