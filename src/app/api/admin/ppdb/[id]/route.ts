import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const updateSchema = z.object({
  status: z.enum(['pending', 'diterima', 'ditolak']).nullable().optional(),
  sync_status: z.enum(['pending', 'success', 'failed']).nullable().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    const updates = [];
    const values = [];

    if (data.status) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.sync_status) {
      updates.push('sync_status = ?');
      values.push(data.sync_status);
    }

    if (updates.length > 0) {
      values.push((await params).id);
      await pool.execute(`UPDATE ppdb_submissions SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    revalidatePath('/scp/ppdb');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [rows] = await pool.execute('SELECT * FROM ppdb_submissions WHERE id = ?', [(await params).id]);
    if ((rows as any[]).length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    return NextResponse.json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
