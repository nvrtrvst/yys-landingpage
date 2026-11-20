import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { ForbiddenError } from '@/lib/errors';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from "isomorphic-dompurify";

const testimonialSchema = z.object({
  author_name: z.string().min(1),
  role: z.string().nullable().optional(),
  content: z.string().min(1),
  image_url: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true),
  unit_id: z.number().int().nullable().optional()
});

export async function GET(request: Request) {
  try {
    const session = await requireModuleOrRoles('testimonials', ['superadmin', 'admin', 'admin_unit']);

    let sql = 'SELECT id, author_name, role, content, image_url, is_active, order_index, unit_id FROM testimonials';
    const params: (number)[] = [];
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
    const result = testimonialSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    let targetUnitId = data.unit_id ?? null;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      targetUnitId = session.user.unit_id;
    }
    const sanitizedContent = DOMPurify.sanitize(data.content);
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO testimonials (author_name, role, content, image_url, order_index, is_active, unit_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.author_name, data.role || null, sanitizedContent, data.image_url || null, data.order_index, data.is_active ? 1 : 0, targetUnitId]
    );

    revalidatePath('/');
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    return handleApiError(error);
  }
}
