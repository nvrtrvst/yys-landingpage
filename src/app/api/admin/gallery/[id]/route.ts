import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_ROLES = ['superadmin', 'admin', 'admin_unit', 'editor'];

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = checkRateLimit(`gallery-write:${getClientIp(request)}`, 20, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: 'Terlalu banyak permintaan' }, { status: 429 });

    const [rows] = await pool.execute<RowDataPacket[]>('SELECT image_url FROM galleries WHERE id = ?', [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    
    const imageUrl = rows[0].image_url;
    
    await pool.execute('DELETE FROM galleries WHERE id = ?', [(await params).id]);

    if (imageUrl.startsWith('/uploads/')) {
      try {
        const filePath = path.join(process.cwd(), 'public', imageUrl);
        await fs.unlink(filePath);
      } catch (err) {
        console.warn('Failed to delete physical file:', err);
      }
    }

    revalidatePath('/');
    revalidatePath('/galeri');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    // Validate title — prevent arbitrary data injection
    const updateSchema = z.object({ title: z.string().max(500).nullable().optional() });
    const result = updateSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    await pool.execute('UPDATE galleries SET title = ? WHERE id = ?', [result.data.title || null, (await params).id]);

    revalidatePath('/');
    revalidatePath('/galeri');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
