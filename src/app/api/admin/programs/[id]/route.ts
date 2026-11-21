import { NextResponse } from 'next/server';
import { ForbiddenError, handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('units', ['superadmin', 'admin', 'admin_unit']);
    const id = (await params).id;
    const [existing] = await pool.execute<RowDataPacket[]>('SELECT unit_id FROM programs WHERE id = ?', [id]);
    if (existing.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    if (session.user.role === 'admin_unit' && existing[0].unit_id !== session.user.unit_id) throw new ForbiddenError('Dilarang');

    const body = await request.json();
    const result = programSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    let targetUnitId = data.unit_id ?? null;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      targetUnitId = session.user.unit_id;
    }
    await pool.execute(
      `UPDATE programs SET title=?, description=?, image_url=?, unit_id=?, order_index=?, status=? WHERE id=?`,
      [data.title, data.description ? DOMPurify.sanitize(data.description) : null, data.image_url || null, targetUnitId, data.order_index, data.status, id]
    );

    revalidatePath('/');
    await revalidateUnitSites();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('units', ['superadmin', 'admin', 'admin_unit']);
    const id = (await params).id;
    const [existing] = await pool.execute<RowDataPacket[]>('SELECT unit_id FROM programs WHERE id = ?', [id]);
    if (existing.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    if (session.user.role === 'admin_unit' && existing[0].unit_id !== session.user.unit_id) throw new ForbiddenError('Dilarang');

    await pool.execute('DELETE FROM programs WHERE id = ?', [id]);
    revalidatePath('/');
    await revalidateUnitSites();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
