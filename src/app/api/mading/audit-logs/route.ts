import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    let where = "";
    const params: (string | number)[] = [];
    if (session.user.role === "admin_unit" && session.user.unit_id) {
      where = "WHERE al.unit_id = ?"; params.push(session.user.unit_id);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT al.*, u.name as user_name, un.name as unit_name
       FROM mading_audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN units un ON al.unit_id = un.id
       ${where} ORDER BY al.created_at DESC LIMIT 100`, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
