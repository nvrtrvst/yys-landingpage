import { NextResponse } from 'next/server';
import { handleApiError, ForbiddenError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
import DOMPurify from 'isomorphic-dompurify';
import { revalidateUnitSites } from '@/lib/revalidate-unit-sites';

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true),
  unit_id: z.number().int().nullable().optional()
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('testimonials', ['superadmin', 'admin', 'admin_unit']);
    const id = (await params).id;
    const [existing] = await pool.execute<RowDataPacket[]>('SELECT unit_id FROM faqs WHERE id = ?', [id]);
    if (existing.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    if (session.user.role === 'admin_unit' && existing[0].unit_id !== session.user.unit_id) throw new ForbiddenError('Dilarang');

    const body = await request.json();
    const result = faqSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    let targetUnitId = data.unit_id ?? null;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      targetUnitId = session.user.unit_id;
    }
    await pool.execute(
      `UPDATE faqs SET question=?, answer=?, category=?, order_index=?, is_active=?, unit_id=? WHERE id=?`,
      [data.question, DOMPurify.sanitize(data.answer), data.category || null, data.order_index, data.is_active ? 1 : 0, targetUnitId, id]
    );

    revalidatePath('/');
    revalidatePath('/ppdb');
    await revalidateUnitSites();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('testimonials', ['superadmin', 'admin', 'admin_unit']);
    const id = (await params).id;
    const [existing] = await pool.execute<RowDataPacket[]>('SELECT unit_id FROM faqs WHERE id = ?', [id]);
    if (existing.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    if (session.user.role === 'admin_unit' && existing[0].unit_id !== session.user.unit_id) throw new ForbiddenError('Dilarang');

    await pool.execute('DELETE FROM faqs WHERE id = ?', [id]);
    revalidatePath('/');
    revalidatePath('/ppdb');
    await revalidateUnitSites();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
