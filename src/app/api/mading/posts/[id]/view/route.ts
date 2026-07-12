import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const postId = (await params).id;
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE mading_posts SET views = views + 1 WHERE id = ?",
      [postId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    }
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT views FROM mading_posts WHERE id = ?",
      [postId]
    );
    return NextResponse.json({ success: true, views: (rows[0] as RowDataPacket).views });
  } catch (error) {
    console.error("Error incrementing views:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
