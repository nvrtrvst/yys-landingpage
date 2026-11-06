import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  ids: z.array(z.number()),
});

export async function POST(request: Request) {
  try {
    await requireRole(['superadmin', 'admin']);

    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const { ids } = result.data;
    if (ids.length === 0) return NextResponse.json({ success: true });

    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(`UPDATE ppdb_submissions SET is_printed = 1 WHERE id IN (${placeholders})`, ids);

    revalidatePath('/scp/ppdb');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return handleApiError(error);
  }
}
