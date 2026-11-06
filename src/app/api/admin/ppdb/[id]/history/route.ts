import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireModuleOrRoles } from "@/lib/api-auth";
import { handleApiError } from "@/lib/errors";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleOrRoles("ppdb_data", ["superadmin", "admin"]);

    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, ppdb_id, action, field, old_value, new_value, note,
              actor_id, actor_name, actor_role, created_at
       FROM ppdb_activity_logs
       WHERE ppdb_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 100`,
      [id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
