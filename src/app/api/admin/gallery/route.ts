import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const gallerySchema = z.object({
  title: z.string().optional().nullable(),
  image_url: z.string().min(1)
});

const ALLOWED_ROLES = ['superadmin', 'admin', 'admin_unit', 'editor'];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = checkRateLimit(`gallery-get:${getClientIp(request)}`, 60, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: 'Terlalu banyak permintaan' }, { status: 429 });

    const [rows] = await pool.execute('SELECT id, title, image_url, created_at FROM galleries ORDER BY created_at DESC');
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
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = checkRateLimit(`gallery-write:${getClientIp(request)}`, 20, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: 'Terlalu banyak permintaan' }, { status: 429 });

    const body = await request.json();
    const result = gallerySchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO galleries (title, image_url) VALUES (?, ?)`,
      [data.title || null, data.image_url]
    );

    revalidatePath('/');
    revalidatePath('/galeri');
    
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
