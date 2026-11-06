import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const testimonialSchema = z.object({
  author_name: z.string().min(1),
  role: z.string().nullable().optional(),
  content: z.string().min(1),
  image_url: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true)
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleOrRoles('testimonials', ['superadmin', 'admin']);

    const body = await request.json();
    const result = testimonialSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    await pool.execute(
      `UPDATE testimonials SET author_name=?, role=?, content=?, image_url=?, order_index=?, is_active=? WHERE id=?`,
      [data.author_name, data.role || null, data.content, data.image_url || null, data.order_index, data.is_active ? 1 : 0, (await params).id]
    );

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleOrRoles('testimonials', ['superadmin', 'admin']);

    await pool.execute('DELETE FROM testimonials WHERE id = ?', [(await params).id]);
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
