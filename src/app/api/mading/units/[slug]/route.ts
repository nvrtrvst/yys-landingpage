import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getUnitBySlug } from "@/lib/mading";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const unit = await getUnitBySlug((await params).slug);
    if (!unit) return NextResponse.json({ error: "Unit tidak ditemukan" }, { status: 404 });

    const [posts] = await pool.execute<RowDataPacket[]>(
      `SELECT p.id, p.title, SUBSTRING(p.content, 1, 200) as excerpt, p.cover_image, p.published_at, p.created_at,
              u.name as author_name, c.name as category_name
       FROM mading_posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN mading_categories c ON p.category_id = c.id
       WHERE p.unit_id = ? AND p.status = 'approved'
       ORDER BY p.published_at DESC LIMIT 50`, [unit.id]);

    return NextResponse.json({
      unit: { id: unit.id, name: unit.name, slug: unit.slug, logo_url: unit.logo_url, primary_color: unit.primary_color || "#16a34a", secondary_color: unit.secondary_color || "#fef08a", tagline: unit.tagline },
      posts,
    });
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
