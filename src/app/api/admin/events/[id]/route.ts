import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { ForbiddenError } from '@/lib/errors';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
import { handleApiError, logError } from '@/lib/errors';
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('events', ['superadmin', 'admin', 'admin_unit', 'editor']);

    const [existingRows] = await pool.execute<RowDataPacket[]>('SELECT unit_id FROM events WHERE id = ?', [(await params).id]);
    if (existingRows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    if (session.user.role === 'admin_unit' && existingRows[0].unit_id !== session.user.unit_id) throw new ForbiddenError('Dilarang');

    const body = await request.json();
    const result = eventSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    let targetUnitId = data.unit_id ?? null;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      targetUnitId = session.user.unit_id;
    }
    await pool.execute(
      `UPDATE events SET title=?, description=?, start_date=?, end_date=?, location=?, image_url=?, unit_id=? WHERE id=?`,
      [data.title, data.description || null, data.start_date, data.end_date, data.location || null, data.image_url || null, targetUnitId, (await params).id]
    );

    revalidatePath('/');
    revalidatePath('/events');
    await revalidateUnitSites();
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error, 'Event Update');
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('events', ['superadmin', 'admin', 'admin_unit', 'editor']);

    const [existingRows] = await pool.execute<RowDataPacket[]>('SELECT unit_id FROM events WHERE id = ?', [(await params).id]);
    if (existingRows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    if (session.user.role === 'admin_unit' && existingRows[0].unit_id !== session.user.unit_id) throw new ForbiddenError('Dilarang');

    await pool.execute('DELETE FROM events WHERE id = ?', [(await params).id]);
    revalidatePath('/');
    revalidatePath('/events');
    await revalidateUnitSites();
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error, 'Event Delete');
    return handleApiError(error);
  }
}
