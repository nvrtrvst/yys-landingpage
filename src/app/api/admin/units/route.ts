import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [rows] = await pool.execute('SELECT * FROM units ORDER BY order_index ASC, id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const result = unitSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data', details: result.error.issues }, { status: 400 });

    const data = result.data;
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO units (name, slug, description, content, image_url, order_index, address, phone, map_coordinates, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.slug, data.description || null, data.content || null, data.image_url || null, data.order_index, data.address || null, data.phone || null, data.map_coordinates || null, data.status]
    );

    revalidatePath('/');
    revalidatePath('/unit/[slug]', 'page');
    
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch(error: unknown) {
    console.error(error);
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Slug sudah digunakan. Silakan gunakan slug lain.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
