import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/errors";
import { handleUnitAdminError } from "@/lib/unit-admin-errors";
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
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT ppdb_config, DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s.%f') AS updated_at FROM units WHERE id = ?", [id]);
    if (rows.length === 0) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ config: parsePpdbConfig(rows[0].ppdb_config), updated_at: rows[0].updated_at });
  } catch (error) {
    return handleUnitAdminError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    await assertUnitAccess(id);
    rateLimitOrThrow(`admin:unit-ppdb:${getClientIp(request)}`, 20, 60 * 1000);

    const body = await request.json();
    const expectedUpdatedAt = typeof body?.updated_at === "string" ? body.updated_at : null;
    if (!expectedUpdatedAt || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6}$/.test(expectedUpdatedAt)) {
      return NextResponse.json({ error: "Data sudah diubah pengguna lain. Muat ulang lalu simpan kembali." }, { status: 409 });
    }
    const config = parsePpdbConfig(body);
    if (!config) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const connection = await pool.getConnection();
    let slug = "";
    let newUpdatedAt: string | null = null;
    try {
      await connection.beginTransaction();

      const [locked] = await connection.execute<RowDataPacket[]>(
        "SELECT slug FROM units WHERE id = ? AND updated_at = ? FOR UPDATE",
        [id, expectedUpdatedAt]
      );
      if (locked.length === 0) {
        await connection.rollback();
        if (expectedUpdatedAt) return NextResponse.json({ error: "Data sudah diubah pengguna lain. Muat ulang lalu simpan kembali." }, { status: 409 });
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      }
      slug = String(locked[0].slug);

      await connection.execute("UPDATE units SET ppdb_config = ?, updated_at=GREATEST(CURRENT_TIMESTAMP(6), updated_at + INTERVAL 1 MICROSECOND) WHERE id = ?", [JSON.stringify(config), id]);
      const [fresh] = await connection.execute<RowDataPacket[]>(
        "SELECT DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s.%f') AS updated_at FROM units WHERE id = ?",
        [id]
      );
      newUpdatedAt = (fresh[0]?.updated_at as string | undefined) ?? null;
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    await revalidateUnitSites([slug]);
    revalidatePath("/ppdb");
    return NextResponse.json({ success: true, config, updated_at: newUpdatedAt });
  } catch (error) {
    return handleUnitAdminError(error);
  }
}
