import { NextResponse } from 'next/server';
import { ForbiddenError, handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from 'isomorphic-dompurify';
import { revalidateUnitSites } from '@/lib/revalidate-unit-sites';

const programSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  unit_id: z.number().int().nullable().optional(),
  order_index: z.number().int().default(0),
  status: z.enum(['active', 'inactive']).default('active')
});

export async function GET(request: Request) {
  try {
    const session = await requireModuleOrRoles('units', ['superadmin', 'admin', 'admin_unit']);
    let sql = 'SELECT p.id, p.title, p.description, p.image_url, p.order_index, p.status, p.unit_id, u.name as unit_name FROM programs p LEFT JOIN units u ON p.unit_id = u.id';
    const params: number[] = [];
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      sql += ' WHERE p.unit_id = ?';
      params.push(session.user.unit_id);
    }
    sql += ' ORDER BY p.order_index ASC, p.id DESC';
    const [rows] = await pool.execute(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireModuleOrRoles('units', ['superadmin', 'admin', 'admin_unit']);
    const body = await request.json();
    const result = programSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    let targetUnitId = data.unit_id ?? null;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      targetUnitId = session.user.unit_id;
    }
    const sanitizedDesc = data.description ? DOMPurify.sanitize(data.description) : null;
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO programs (title, description, image_url, unit_id, order_index, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.title, sanitizedDesc, data.image_url || null, targetUnitId, data.order_index, data.status]
    );

    revalidatePath('/');
    await revalidateUnitSites();
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    return handleApiError(error);
  }
}
