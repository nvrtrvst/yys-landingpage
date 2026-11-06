import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { requireModuleOrRoles } from '@/lib/api-auth';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from "isomorphic-dompurify";

const newsSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  published_at: z.string().nullable().optional()
});

export async function GET(request: Request) {
  try {
    await requireModuleOrRoles('news', ['superadmin', 'admin', 'editor']);

    const [rows] = await pool.execute('SELECT id, title, slug, image_url, category, status, published_at, created_at FROM news ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireModuleOrRoles('news', ['superadmin', 'admin', 'editor']);

    const body = await request.json();
    const result = newsSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data', details: result.error.issues }, { status: 400 });

    const data = result.data;
    
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
      publishedAt = new Date().toISOString().slice(0, 19).replace('T', ' '); // format for MySQL
    }

    const sanitizedContent = data.content ? DOMPurify.sanitize(data.content) : null;
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO news (title, slug, content, image_url, category, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.slug, sanitizedContent, data.image_url || null, data.category || null, data.status, publishedAt]
    );

    revalidatePath('/');
    revalidatePath('/berita');
    revalidatePath(`/berita/${data.slug}`);
    
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch(error: unknown) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Slug sudah digunakan. Silakan gunakan slug/judul lain.' }, { status: 400 });
    }
    return handleApiError(error);
  }
}
