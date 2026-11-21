import { NextResponse } from 'next/server';
import { ForbiddenError, handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from "isomorphic-dompurify";
import { revalidateUnitSites } from '@/lib/revalidate-unit-sites';

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true),
  unit_id: z.number().int().nullable().optional()
});

export async function GET(request: Request) {
  try {
    const session = await requireModuleOrRoles('testimonials', ['superadmin', 'admin', 'admin_unit']);
    let sql = 'SELECT id, question, answer, category, order_index, is_active, unit_id FROM faqs';
    const params: number[] = [];
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      sql += ' WHERE unit_id = ?';
      params.push(session.user.unit_id);
    }
    sql += ' ORDER BY order_index ASC, id DESC';
    const [rows] = await pool.execute(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireModuleOrRoles('testimonials', ['superadmin', 'admin', 'admin_unit']);

    const body = await request.json();
    const result = faqSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    let targetUnitId = data.unit_id ?? null;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      targetUnitId = session.user.unit_id;
    }
    const sanitizedAnswer = DOMPurify.sanitize(data.answer);
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO faqs (question, answer, category, order_index, is_active, unit_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.question, sanitizedAnswer, data.category || null, data.order_index, data.is_active ? 1 : 0, targetUnitId]
    );

    revalidatePath('/');
    revalidatePath('/ppdb');
    await revalidateUnitSites();
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    return handleApiError(error);
  }
}
