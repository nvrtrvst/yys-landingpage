import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { getServerSessionDual, madingAuthOptions } from "@/lib/mading-auth";
import { z } from "zod";
import { getPagination, sanitizeHtml, canAccessUnit, isModerator, generateUniqueSlug } from "@/lib/mading";
import { revalidatePath } from "next/cache";

const postSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  content: z.string().min(10, "Konten minimal 10 karakter"),
  cover_image: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  category_slug: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const { offset } = getPagination(page, limit);

    const session = await getServerSessionDual();
    const isMod = session && isModerator(session.user.role);

    let where = isMod ? "WHERE 1=1" : "WHERE p.status = 'approved'";
    const params: (string | number)[] = [];

    if (slug && !isMod) {
      const [units] = await pool.execute<RowDataPacket[]>("SELECT id FROM units WHERE slug = ? AND status = 'active'", [slug]);
      if (units.length > 0) { where += " AND p.unit_id = ?"; params.push((units[0] as RowDataPacket).id); }
    } else if (slug && isMod) {
      const [units] = await pool.execute<RowDataPacket[]>("SELECT id FROM units WHERE slug = ?", [slug]);
      if (units.length > 0) {
        if (!canAccessUnit(session!.user.role, session!.user.unit_id, (units[0] as RowDataPacket).id)) {
          return NextResponse.json({ error: "Dilarang" }, { status: 403 });
        }
        where += " AND p.unit_id = ?"; params.push((units[0] as RowDataPacket).id);
      }
    }

    if (status && isMod) { where += " AND p.status = ?"; params.push(status); }
    if (category) { where += " AND p.category_id = ?"; params.push(parseInt(category)); }

    const [countRows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM mading_posts p ${where}`, params);
    const total = (countRows[0] as any).total;

    const [rows] = await pool.execute<RowDataPacket[]>(
       `SELECT p.id, p.slug, p.title, SUBSTRING(p.content, 1, 200) as excerpt, p.cover_image, p.category_id, p.author_id, p.unit_id, p.status, p.revision_note, p.published_at, p.created_at, p.updated_at, p.views,
               u.name as author_name, c.name as category_name, c.slug as category_slug, un.slug as unit_slug
       FROM mading_posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN mading_categories c ON p.category_id = c.id
       LEFT JOIN units un ON p.unit_id = un.id
       ${where}
       ${isMod ? "ORDER BY p.updated_at DESC" : "ORDER BY p.published_at DESC"}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return NextResponse.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching mading posts:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(madingAuthOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const body = await request.json();
    const valid = postSchema.safeParse(body);
    if (!valid.success) {
      return NextResponse.json({ error: "Data tidak valid", details: valid.error.issues }, { status: 400 });
    }

    const { title, content, cover_image, category_id, category_slug } = valid.data;

    // Resolve kategori dari id atau slug (slug memudahkan client tanpa fetch daftar kategori).
    let resolvedCategoryId: number | null = category_id || null;
    if (!resolvedCategoryId && category_slug) {
      const [cr] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM mading_categories WHERE slug = ? AND is_active = 1", [category_slug]
      );
      if (cr.length > 0) resolvedCategoryId = (cr[0] as { id: number }).id;
    }

    // Unit scoping: hanya superadmin/admin yg boleh memilih unit lain.
    // Siswa/guru/admin_unit dipaksa pakai unit sendiri (cegah IDOR).
    const isPrivileged = ["superadmin", "admin"].includes(session.user.role);
    const unitId = isPrivileged && body.unit_id ? body.unit_id : session.user.unit_id;
    if (!unitId) return NextResponse.json({ error: "Unit tidak ditemukan" }, { status: 400 });

    // Validasi kategori: harus ada, aktif, dan milik unit yg sama atau global.
    if (resolvedCategoryId) {
      const [cats] = await pool.execute<RowDataPacket[]>(
        "SELECT id, slug, unit_id FROM mading_categories WHERE id = ? AND is_active = 1",
        [resolvedCategoryId]
      );
      if (cats.length === 0) return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
      const cat = cats[0] as { id: number; slug: string; unit_id: number | null };
      if (cat.unit_id !== null && cat.unit_id !== unitId)
        return NextResponse.json({ error: "Kategori tidak sesuai unit" }, { status: 400 });

      // Pengumuman hanya boleh dibuat oleh moderator (guru/admin).
      if (cat.slug === "pengumuman" && !isModerator(session.user.role))
        return NextResponse.json({ error: "Hanya guru/admin yang dapat membuat Pengumuman" }, { status: 403 });
    }

    const slug = await generateUniqueSlug(title);

    const [inserted] = await pool.execute<ResultSetHeader>(
      `INSERT INTO mading_posts (title, slug, content, cover_image, category_id, author_id, unit_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [title, slug, sanitizeHtml(content), cover_image || null, resolvedCategoryId || null, parseInt(session.user.id), unitId]
    );

    revalidatePath("/mading");
    return NextResponse.json({ success: true, id: inserted.insertId, status: "draft" });
  } catch (error) {
    console.error("Error creating mading post:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
