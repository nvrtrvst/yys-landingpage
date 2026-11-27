import { NextResponse } from 'next/server';
import { ForbiddenError } from '@/lib/errors';
import { handleUnitAdminError, unitValidationResponse } from '@/lib/unit-admin-errors';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { revalidatePath } from 'next/cache';
import { isReservedUnitSlug, revalidateUnitSites } from '@/lib/revalidate-unit-sites';
import { UNIT_INSERT_SQL, UNIT_SELECT, unitParams, unitSchema } from '@/lib/unit-admin';
import { rateLimitOrThrow, getClientIp } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const session = await requireModuleOrRoles('units', ['superadmin', 'admin', 'admin_unit']);
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id) throw new ForbiddenError('Akun unit belum terhubung ke unit');
      const [rows] = await pool.execute(`SELECT id, ${UNIT_SELECT}, DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s.%f') AS updated_at FROM units WHERE id = ?`, [session.user.unit_id]);
      return NextResponse.json(rows);
    }

    const [rows] = await pool.execute(`SELECT id, ${UNIT_SELECT}, DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s.%f') AS updated_at FROM units ORDER BY order_index ASC, id DESC`);
    return NextResponse.json(rows);
  } catch (error) {
    return handleUnitAdminError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireModuleOrRoles('units', ['superadmin', 'admin']);
    rateLimitOrThrow(`admin:units:${getClientIp(request)}`, 20, 60 * 1000);

    const body = await request.json();
    const result = unitSchema.safeParse(body);
    if (!result.success) return unitValidationResponse(result.error.issues);

    const data = result.data;
    if (isReservedUnitSlug(data.slug)) {
      return NextResponse.json({ error: 'Slug tidak tersedia.' }, { status: 400 });
    }
    const [insertResult] = await pool.execute<ResultSetHeader>(UNIT_INSERT_SQL, unitParams(data));

    revalidatePath('/');
    revalidatePath('/sd');
    revalidatePath('/tk');
    revalidatePath('/smp');
    revalidatePath('/smk');
    revalidatePath('/lpq');
    await revalidateUnitSites([data.slug]);

    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch(error: unknown) {
    return handleUnitAdminError(error);
  }
}
