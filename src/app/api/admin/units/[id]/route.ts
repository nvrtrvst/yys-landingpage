import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
import { isReservedUnitSlug, revalidateUnitSites } from '@/lib/revalidate-unit-sites';
import { UNIT_SELECT, UNIT_UPDATE_SQL, unitParams, unitSchema } from '@/lib/unit-admin';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleOrRoles('units', ['superadmin', 'admin']);

    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT id, ${UNIT_SELECT}, mading_enabled, created_at FROM units WHERE id = ?`, [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleOrRoles('units', ['superadmin', 'admin']);

    const body = await request.json();
    const result = unitSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    if (isReservedUnitSlug(data.slug)) {
      return NextResponse.json({ error: 'Slug tidak tersedia.' }, { status: 400 });
    }
    const id = (await params).id;
    const [existing] = await pool.execute<RowDataPacket[]>('SELECT slug FROM units WHERE id = ?', [id]);
    const oldSlug = existing[0]?.slug as string | undefined;
    await pool.execute(UNIT_UPDATE_SQL, [...unitParams(data), id]);

    revalidatePath('/');
    revalidatePath(`/unit/${data.slug}`);
    await revalidateUnitSites([oldSlug, data.slug]);
    return NextResponse.json({ success: true });
  } catch(error: unknown) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Slug sudah digunakan.' }, { status: 400 });
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleOrRoles('units', ['superadmin', 'admin']);

    // Cek relasi ke PPDB atau Programs
    const [ppdb] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM ppdb_submissions WHERE unit = (SELECT name FROM units WHERE id = ?)', [(await params).id]);
    if (ppdb[0].count > 0) return NextResponse.json({ error: 'Tidak dapat dihapus karena unit ini masih direferensikan pada data pendaftar PPDB.' }, { status: 400 });

    const id = (await params).id;
    const [existing] = await pool.execute<RowDataPacket[]>('SELECT slug FROM units WHERE id = ?', [id]);
    const oldSlug = existing[0]?.slug as string | undefined;
    await pool.execute('DELETE FROM units WHERE id = ?', [id]);
    revalidatePath('/');
    await revalidateUnitSites([oldSlug]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
