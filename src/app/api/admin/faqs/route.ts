import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from "isomorphic-dompurify";

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true)
});

export async function GET(request: Request) {
  try {
    await requireModuleOrRoles('testimonials', ['superadmin', 'admin']);

    const [rows] = await pool.execute('SELECT id, question, answer, order_index, is_active FROM faqs ORDER BY order_index ASC, id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireModuleOrRoles('testimonials', ['superadmin', 'admin']);

    const body = await request.json();
    const result = faqSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    const sanitizedAnswer = DOMPurify.sanitize(data.answer);
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO faqs (question, answer, category, order_index, is_active) VALUES (?, ?, ?, ?, ?)`,
      [data.question, sanitizedAnswer, data.category || null, data.order_index, data.is_active ? 1 : 0]
    );

    revalidatePath('/');
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    return handleApiError(error);
  }
}
