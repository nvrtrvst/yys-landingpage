import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  ids: z.array(z.number()),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
