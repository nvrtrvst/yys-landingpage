import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireRole } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from "isomorphic-dompurify";

const programSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  unit_id: z.number().int().nullable().optional(),
  order_index: z.number().int().default(0),
  status: z.enum(['active', 'inactive']).default('active')
});

export async function GET(request: Request) {
  try {
    await requireRole(['superadmin', 'admin']);

    const [rows] = await pool.execute('SELECT p.id, p.title, p.description, p.image_url, p.order_index, p.status, u.name as unit_name FROM programs p LEFT JOIN units u ON p.unit_id = u.id ORDER BY p.order_index ASC, p.id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(['superadmin', 'admin']);

    const body = await request.json();
    const result = programSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    const sanitizedDesc = data.description ? DOMPurify.sanitize(data.description) : null;
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO programs (title, description, image_url, unit_id, order_index, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.title, sanitizedDesc, data.image_url || null, data.unit_id || null, data.order_index, data.status]
    );

    revalidatePath('/');
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    return handleApiError(error);
  }
}
