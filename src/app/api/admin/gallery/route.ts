import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { ForbiddenError } from '@/lib/errors';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { rateLimitOrThrow, getClientIp } from "@/lib/rate-limit";
import { revalidateUnitSites } from '@/lib/revalidate-unit-sites';

const gallerySchema = z.object({
  title: z.string().optional().nullable(),
  image_url: z.string().min(1)
});

export async function GET(request: Request) {
  try {
    const session = await requireModuleOrRoles('gallery', ['superadmin', 'admin', 'admin_unit', 'editor']);

    rateLimitOrThrow(`gallery-get:${getClientIp(request)}`, 60, 60_000);

    let sql = 'SELECT id, title, image_url, created_at, unit_id FROM galleries';
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
    const session = await requireModuleOrRoles('gallery', ['superadmin', 'admin', 'admin_unit', 'editor']);

    rateLimitOrThrow(`gallery-write:${getClientIp(request)}`, 20, 60_000);

    const body = await request.json();
    const result = gallerySchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    let targetUnitId: number | null = null;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      targetUnitId = session.user.unit_id;
    }
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO galleries (title, image_url, unit_id) VALUES (?, ?, ?)`,
      [data.title || null, data.image_url, targetUnitId]
    );

    revalidatePath('/');
    revalidatePath('/galeri');
    await revalidateUnitSites();

    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    return handleApiError(error);
  }
}
