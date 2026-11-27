import { NextResponse } from 'next/server';
import { ForbiddenError, handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
import { isReservedUnitSlug, revalidateUnitSites } from '@/lib/revalidate-unit-sites';
import { UNIT_SELECT, UNIT_UPDATE_SQL, unitParams, unitSchema } from '@/lib/unit-admin';
import { rateLimitOrThrow, getClientIp } from '@/lib/rate-limit';

const CONFLICT_MESSAGE = 'Data sudah diubah pengguna lain. Muat ulang lalu simpan kembali.';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('units', ['superadmin', 'admin', 'admin_unit']);
    const id = (await params).id;
    if (session.user.role === 'admin_unit' && session.user.unit_id !== Number(id)) throw new ForbiddenError('Dilarang');

    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT id, ${UNIT_SELECT}, mading_enabled, created_at, DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s.%f') AS updated_at FROM units WHERE id = ?`, [id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('units', ['superadmin', 'admin', 'admin_unit']);
    const id = (await params).id;
    if (session.user.role === 'admin_unit') {
      if (!session.user.unit_id || session.user.unit_id !== Number(id)) throw new ForbiddenError('Dilarang');
    }
    rateLimitOrThrow(`admin:units:${getClientIp(request)}`, 20, 60 * 1000);

    const body = await request.json();
    const expectedUpdatedAt = typeof body?.updated_at === 'string' ? body.updated_at : null;
    if (!expectedUpdatedAt || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6}$/.test(expectedUpdatedAt)) {
      return NextResponse.json({ error: CONFLICT_MESSAGE }, { status: 409 });
    }
    const result = unitSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;

    const connection = await pool.getConnection();
    let oldSlug = data.slug;
    let newUpdatedAt: string | null = null;
    try {
      await connection.beginTransaction();

      const [locked] = await connection.execute<RowDataPacket[]>(
        "SELECT slug, status, order_index FROM units WHERE id = ? AND updated_at = ? FOR UPDATE",
        [id, expectedUpdatedAt]
      );
      if (locked.length === 0) {
        await connection.rollback();
        if (expectedUpdatedAt) return NextResponse.json({ error: CONFLICT_MESSAGE }, { status: 409 });
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }
      oldSlug = String(locked[0].slug);

      let payload = data;
      if (session.user.role === 'admin_unit') {
        if (data.slug !== oldSlug) throw new ForbiddenError('Slug tidak dapat diubah oleh admin unit');
        payload = { ...data, slug: oldSlug, status: locked[0].status, order_index: locked[0].order_index };
      } else if (isReservedUnitSlug(data.slug)) {
        await connection.rollback();
        return NextResponse.json({ error: 'Slug tidak tersedia.' }, { status: 400 });
      }

      await connection.execute(UNIT_UPDATE_SQL, [...unitParams(payload), id]);
      const [fresh] = await connection.execute<RowDataPacket[]>(
        "SELECT DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s.%f') AS updated_at FROM units WHERE id = ?",
        [id]
      );
      newUpdatedAt = (fresh[0]?.updated_at as string | undefined) ?? null;
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    revalidatePath('/');
    revalidatePath(`/${data.slug}`);
    await revalidateUnitSites([oldSlug, data.slug]);
    return NextResponse.json({ success: true, updated_at: newUpdatedAt });
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
