import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from "isomorphic-dompurify";

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  location: z.string().nullable().optional(),
  image_url: z.string().nullable().optional()
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'superadmin' && role !== 'admin' && role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [rows] = await pool.execute('SELECT id, title, description, start_date, end_date, location, image_url FROM events ORDER BY start_date ASC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'superadmin' && role !== 'admin' && role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = eventSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    const sanitizedDesc = data.description ? DOMPurify.sanitize(data.description) : null;
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO events (title, description, start_date, end_date, location, image_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.title, sanitizedDesc, data.start_date, data.end_date, data.location || null, data.image_url || null]
    );

    revalidatePath('/');
    revalidatePath('/events');
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
