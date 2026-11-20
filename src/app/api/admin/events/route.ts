import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { ForbiddenError } from '@/lib/errors';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from "isomorphic-dompurify";
import { revalidateUnitSites } from '@/lib/revalidate-unit-sites';

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  location: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  unit_id: z.number().int().nullable().optional()
});

export async function GET(request: Request) {
  try {
    const session = await requireModuleOrRoles('events', ['superadmin', 'admin', 'admin_unit', 'editor']);

    let sql = 'SELECT id, title, description, start_date, end_date, location, image_url, unit_id FROM events';
    const params: (number)[] = [];
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      sql += ' WHERE unit_id = ?';
      params.push(session.user.unit_id);
    }
    sql += ' ORDER BY start_date ASC';
    const [rows] = await pool.execute(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireModuleOrRoles('events', ['superadmin', 'admin', 'admin_unit', 'editor']);

    const body = await request.json();
    const result = eventSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    let targetUnitId = data.unit_id ?? null;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      targetUnitId = session.user.unit_id;
    }
    const sanitizedDesc = data.description ? DOMPurify.sanitize(data.description) : null;
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO events (title, description, start_date, end_date, location, image_url, unit_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.title, sanitizedDesc, data.start_date, data.end_date, data.location || null, data.image_url || null, targetUnitId]
    );

    revalidatePath('/');
    revalidatePath('/events');
    await revalidateUnitSites();
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    return handleApiError(error);
  }
}
