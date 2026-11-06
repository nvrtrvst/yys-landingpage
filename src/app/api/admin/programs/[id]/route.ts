import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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
    await requireModuleOrRoles('units', ['superadmin', 'admin']);

    const body = await request.json();
    const result = programSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    await pool.execute(
      `UPDATE programs SET title=?, description=?, image_url=?, unit_id=?, order_index=?, status=? WHERE id=?`,
      [data.title, data.description || null, data.image_url || null, data.unit_id || null, data.order_index, data.status, (await params).id]
    );

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleOrRoles('units', ['superadmin', 'admin']);

    await pool.execute('DELETE FROM programs WHERE id = ?', [(await params).id]);
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
