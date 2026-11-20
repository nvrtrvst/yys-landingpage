import { NextResponse } from 'next/server';
import { handleApiError, ForbiddenError } from '@/lib/errors';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const testimonialSchema = z.object({
  author_name: z.string().min(1),
  role: z.string().nullable().optional(),
  content: z.string().min(1),
  image_url: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true),
  unit_id: z.number().int().nullable().optional()
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('testimonials', ['superadmin', 'admin', 'admin_unit']);

    const [existingRows] = await pool.execute<RowDataPacket[]>('SELECT unit_id FROM testimonials WHERE id = ?', [(await params).id]);
    if (existingRows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    if (session.user.role === 'admin_unit' && existingRows[0].unit_id !== session.user.unit_id) throw new ForbiddenError('Dilarang');

    const body = await request.json();
    const result = testimonialSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    let targetUnitId = data.unit_id ?? null;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      targetUnitId = session.user.unit_id;
    }
    await pool.execute(
      `UPDATE testimonials SET author_name=?, role=?, content=?, image_url=?, order_index=?, is_active=?, unit_id=? WHERE id=?`,
      [data.author_name, data.role || null, data.content, data.image_url || null, data.order_index, data.is_active ? 1 : 0, targetUnitId, (await params).id]
    );

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('testimonials', ['superadmin', 'admin', 'admin_unit']);

    const [existingRows] = await pool.execute<RowDataPacket[]>('SELECT unit_id FROM testimonials WHERE id = ?', [(await params).id]);
    if (existingRows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    if (session.user.role === 'admin_unit' && existingRows[0].unit_id !== session.user.unit_id) throw new ForbiddenError('Dilarang');

    await pool.execute('DELETE FROM testimonials WHERE id = ?', [(await params).id]);
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
