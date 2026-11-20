import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { isReservedUnitSlug, revalidateUnitSites } from '@/lib/revalidate-unit-sites';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Warna tidak valid');

const unitSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  primary_color: hexColor.nullable().optional(),
  secondary_color: hexColor.nullable().optional(),
  tagline: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  map_coordinates: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active')
});

export async function GET(request: Request) {
  try {
    await requireModuleOrRoles('units', ['superadmin', 'admin']);

    const [rows] = await pool.execute('SELECT id, name, slug, description, tagline, logo_url, primary_color, secondary_color, order_index, status FROM units ORDER BY order_index ASC, id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireModuleOrRoles('units', ['superadmin', 'admin']);

    const body = await request.json();
    const result = unitSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data', details: result.error.issues }, { status: 400 });

    const data = result.data;
    if (isReservedUnitSlug(data.slug)) {
      return NextResponse.json({ error: 'Slug tidak tersedia.' }, { status: 400 });
    }
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO units (name, slug, description, content, image_url, logo_url, primary_color, secondary_color, tagline, order_index, address, phone, map_coordinates, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.slug, data.description || null, data.content || null, data.image_url || null, data.logo_url || null, data.primary_color || null, data.secondary_color || null, data.tagline || null, data.order_index, data.address || null, data.phone || null, data.map_coordinates || null, data.status]
    );

    revalidatePath('/');
    revalidatePath('/unit/[slug]', 'page');
    await revalidateUnitSites([data.slug]);

    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch(error: unknown) {
    console.error(error);
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Slug sudah digunakan. Silakan gunakan slug lain.' }, { status: 400 });
    }
    return handleApiError(error);
  }
}
