import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';

const unitSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  map_coordinates: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active')
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM units WHERE id = ?', [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const result = unitSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    await pool.execute(
      `UPDATE units SET name=?, slug=?, description=?, content=?, image_url=?, order_index=?, address=?, phone=?, map_coordinates=?, status=? WHERE id=?`,
      [data.name, data.slug, data.description || null, data.content || null, data.image_url || null, data.order_index, data.address || null, data.phone || null, data.map_coordinates || null, data.status, (await params).id]
    );

    revalidatePath('/');
    revalidatePath(`/unit/${data.slug}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Slug sudah digunakan.' }, { status: 400 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Cek relasi ke PPDB atau Programs
    const [ppdb] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM ppdb_submissions WHERE unit = (SELECT name FROM units WHERE id = ?)', [(await params).id]);
    if (ppdb[0].count > 0) return NextResponse.json({ error: 'Tidak dapat dihapus karena unit ini masih direferensikan pada data pendaftar PPDB.' }, { status: 400 });

    await pool.execute('DELETE FROM units WHERE id = ?', [(await params).id]);
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
