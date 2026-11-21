import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { revalidatePath } from 'next/cache';
import { isReservedUnitSlug, revalidateUnitSites } from '@/lib/revalidate-unit-sites';
import { UNIT_INSERT_SQL, UNIT_SELECT, unitParams, unitSchema } from '@/lib/unit-admin';

export async function GET(request: Request) {
  try {
    await requireModuleOrRoles('units', ['superadmin', 'admin']);

    const [rows] = await pool.execute(`SELECT id, ${UNIT_SELECT} FROM units ORDER BY order_index ASC, id DESC`);
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
    const [insertResult] = await pool.execute<ResultSetHeader>(UNIT_INSERT_SQL, unitParams(data));

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
