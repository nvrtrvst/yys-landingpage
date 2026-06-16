import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [rows] = await pool.execute('SELECT id, title, slug, image_url, category, status, published_at, created_at FROM news ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = newsSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data', details: result.error.issues }, { status: 400 });

    const data = result.data;
    
    // Set published_at if status is published
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

    const [insertResult] = await pool.execute(
      `INSERT INTO news (title, slug, content, image_url, category, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.slug, data.content || null, data.image_url || null, data.category || null, data.status, publishedAt]
    );

    revalidatePath('/');
    revalidatePath('/berita');
    revalidatePath(`/berita/${data.slug}`);
    
    return NextResponse.json({ success: true, id: (insertResult as any).insertId });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Slug sudah digunakan. Silakan gunakan slug/judul lain.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
