import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSessionDual } from "@/lib/mading-auth";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSessionDual();
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const commentId = (await params).id;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id, c.post_id, p.unit_id as post_unit_id
       FROM mading_comments c JOIN mading_posts p ON c.post_id = p.id
       WHERE c.id = ?`, [commentId]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const { post_unit_id } = rows[0] as { post_unit_id: number | null };
    if (session.user.role === "admin_unit" && post_unit_id !== session.user.unit_id)
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    await pool.execute("DELETE FROM mading_comments WHERE id = ?", [commentId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSessionDual();
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const commentId = (await params).id;
    const body = await request.json();
    const action = body?.action;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id, c.post_id, p.unit_id as post_unit_id
       FROM mading_comments c JOIN mading_posts p ON c.post_id = p.id
       WHERE c.id = ?`, [commentId]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const { post_unit_id } = rows[0] as { post_unit_id: number | null };
    if (session.user.role === "admin_unit" && post_unit_id !== session.user.unit_id)
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    if (action === "approve") {
      await pool.execute<ResultSetHeader>(
        "UPDATE mading_comments SET is_flagged = 0, flag_reason = NULL, moderated_at = NOW(), moderated_by = ? WHERE id = ?",
        [parseInt(session.user.id), commentId]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Error moderating comment:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
