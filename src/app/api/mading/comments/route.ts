import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSessionDual } from "@/lib/mading-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSessionDual();
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const params: (string | number)[] = [];
    let unitClause = "";
    if (session.user.role === "admin_unit") {
      unitClause = "AND p.unit_id = ?";
      params.push(session.user.unit_id as number);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id, c.content, c.created_at, c.flag_reason, c.post_id, p.title as post_title,
              u.name as user_name, u.nis as user_nis, u.role as user_role, u.unit_id as user_unit_id
       FROM mading_comments c
       JOIN mading_posts p ON c.post_id = p.id
       JOIN users u ON c.user_id = u.id
       WHERE c.is_flagged = 1 ${unitClause}
       ORDER BY c.created_at DESC LIMIT 200`,
      params
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching flagged comments:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
