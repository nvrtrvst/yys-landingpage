import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true)
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['superadmin', 'admin']);

    const body = await request.json();
    const result = faqSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    await pool.execute(
      `UPDATE faqs SET question=?, answer=?, category=?, order_index=?, is_active=? WHERE id=?`,
      [data.question, data.answer, data.category || null, data.order_index, data.is_active ? 1 : 0, (await params).id]
    );

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['superadmin', 'admin']);

    await pool.execute('DELETE FROM faqs WHERE id = ?', [(await params).id]);
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
