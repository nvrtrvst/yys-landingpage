import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { ForbiddenError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from "isomorphic-dompurify";
import { revalidateUnitSites } from '@/lib/revalidate-unit-sites';

const newsSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  published_at: z.string().nullable().optional(),
  unit_id: z.number().int().nullable().optional()
});

export async function GET(request: Request) {
  try {
    const session = await requireModuleOrRoles('news', ['superadmin', 'admin', 'admin_unit', 'editor']);

    let sql = 'SELECT id, title, slug, image_url, category, status, published_at, created_at, unit_id FROM news';
    const params: (number)[] = [];
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      sql += ' WHERE unit_id = ?';
      params.push(session.user.unit_id);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireModuleOrRoles('news', ['superadmin', 'admin', 'admin_unit', 'editor']);

    const body = await request.json();
    const result = newsSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data', details: result.error.issues }, { status: 400 });

    const data = result.data;

    let targetUnitId = data.unit_id ?? null;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      targetUnitId = session.user.unit_id;
    }

    let publishedAt = data.published_at || null;
    if (publishedAt) {
      // If it's a valid date string, format it for MySQL
      try {
        const d = new Date(publishedAt);
        if (!isNaN(d.getTime())) {
          publishedAt = d.toISOString().slice(0, 19).replace('T', ' ');
        }
      } catch (e) {}
    }
    if (data.status === 'published' && !publishedAt) {
      publishedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    const sanitizedContent = data.content ? DOMPurify.sanitize(data.content) : null;
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO news (title, slug, content, image_url, category, status, published_at, unit_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.slug, sanitizedContent, data.image_url || null, data.category || null, data.status, publishedAt, targetUnitId]
    );

    revalidatePath('/');
    revalidatePath('/berita');
    revalidatePath(`/berita/${data.slug}`);
    await revalidateUnitSites();

    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch(error: unknown) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Slug sudah digunakan. Silakan gunakan slug/judul lain.' }, { status: 400 });
    }
    return handleApiError(error);
  }
}
