import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true)
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [rows] = await pool.execute('SELECT * FROM faqs ORDER BY order_index ASC, id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const result = faqSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    const [insertResult] = await pool.execute(
      `INSERT INTO faqs (question, answer, category, order_index, is_active) VALUES (?, ?, ?, ?, ?)`,
      [data.question, data.answer, data.category || null, data.order_index, data.is_active ? 1 : 0]
    );

    revalidatePath('/');
    return NextResponse.json({ success: true, id: (insertResult as any).insertId });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
