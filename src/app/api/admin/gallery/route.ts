import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { rateLimitOrThrow, getClientIp } from "@/lib/rate-limit";

const gallerySchema = z.object({
  title: z.string().optional().nullable(),
  image_url: z.string().min(1)
});

export async function GET(request: Request) {
  try {
    await requireModuleOrRoles('gallery', ['superadmin', 'admin', 'admin_unit', 'editor']);

    rateLimitOrThrow(`gallery-get:${getClientIp(request)}`, 60, 60_000);

    const [rows] = await pool.execute('SELECT id, title, image_url, created_at FROM galleries ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireModuleOrRoles('gallery', ['superadmin', 'admin', 'admin_unit', 'editor']);

    rateLimitOrThrow(`gallery-write:${getClientIp(request)}`, 20, 60_000);

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
    return handleApiError(error);
  }
}
