import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSessionDual } from "@/lib/mading-auth";

export async function GET() {
  try {
    const session = await getServerSessionDual();
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const [rows] = await pool.execute<RowDataPacket[]>(
       `SELECT p.id, p.slug, p.title, SUBSTRING(p.content, 1, 200) as excerpt, p.cover_image, p.category_id, p.author_id, p.unit_id, p.status, p.revision_note, p.published_at, p.created_at, p.updated_at, p.views,
                c.name as category_name, c.slug as category_slug, un.slug as unit_slug
       FROM mading_posts p
       LEFT JOIN mading_categories c ON p.category_id = c.id
       LEFT JOIN units un ON p.unit_id = un.id
       WHERE p.author_id = ?
       ORDER BY p.updated_at DESC`,
      [parseInt(session.user.id)]
    );

    const [statRows] = await pool.execute<RowDataPacket[]>(
      "SELECT status, COUNT(*) as total FROM mading_posts WHERE author_id = ? GROUP BY status",
      [parseInt(session.user.id)]
    );

    const stats: Record<string, number> = { draft: 0, pending: 0, approved: 0, revision: 0, rejected: 0 };
    statRows.forEach((r: RowDataPacket) => {
      stats[r.status as string] = (r.total as number) || 0;
    });

    return NextResponse.json({ data: rows, stats });
  } catch (error) {
    console.error("Error fetching my posts:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
