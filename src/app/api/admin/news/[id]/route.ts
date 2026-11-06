import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['superadmin', 'admin', 'editor']);

    const [rows] = await pool.execute<RowDataPacket[]>('SELECT id, title, slug, content, image_url, category, status, published_at, created_at FROM news WHERE id = ?', [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching news:', error);
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['superadmin', 'admin', 'editor']);

    const body = await request.json();
    const result = newsSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    let publishedAt = data.published_at || null;
    if (publishedAt) {
      // If it's a valid date string (like ISO string from frontend), format it for MySQL
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
    await pool.execute(
      `UPDATE news SET title=?, slug=?, content=?, image_url=?, category=?, status=?, published_at=? WHERE id=?`,
      [data.title, data.slug, sanitizedContent, data.image_url || null, data.category || null, data.status, publishedAt, (await params).id]
    );

    revalidatePath('/');
    revalidatePath('/berita');
    revalidatePath(`/berita/${data.slug}`);
    
    return NextResponse.json({ success: true });
  } catch(error: unknown) {
    console.error('Error updating news:', error);
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Slug sudah digunakan.' }, { status: 400 });
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['superadmin', 'admin', 'editor']);

    await pool.execute('DELETE FROM news WHERE id = ?', [(await params).id]);
    
    revalidatePath('/');
    revalidatePath('/berita');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news:', error);
    return handleApiError(error);
  }
}
