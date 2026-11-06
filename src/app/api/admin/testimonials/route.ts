import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireRole } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from "isomorphic-dompurify";

const testimonialSchema = z.object({
  author_name: z.string().min(1),
  role: z.string().nullable().optional(),
  content: z.string().min(1),
  image_url: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true)
});

export async function GET(request: Request) {
  try {
    await requireRole(['superadmin', 'admin']);

    const [rows] = await pool.execute('SELECT id, author_name, role, content, image_url, is_active, order_index FROM testimonials ORDER BY order_index ASC, id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(['superadmin', 'admin']);

    const body = await request.json();
    const result = testimonialSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    const sanitizedContent = DOMPurify.sanitize(data.content);
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO testimonials (author_name, role, content, image_url, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.author_name, data.role || null, sanitizedContent, data.image_url || null, data.order_index, data.is_active ? 1 : 0]
    );

    revalidatePath('/');
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    return handleApiError(error);
  }
}
