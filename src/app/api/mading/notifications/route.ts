import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(madingAuthOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT n.*, p.title as post_title FROM mading_notifications n
       LEFT JOIN mading_posts p ON n.post_id = p.id
       WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 20`,
      [parseInt(session.user.id)]
    );
    const [unread] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM mading_notifications WHERE user_id = ? AND is_read = 0",
      [parseInt(session.user.id)]
    );
    return NextResponse.json({ data: rows, unreadCount: (unread[0] as RowDataPacket).count });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
