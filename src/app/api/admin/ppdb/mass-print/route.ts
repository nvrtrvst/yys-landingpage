import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
import { actorFromSession, logPpdbActivity } from '@/lib/ppdb-activity';

const schema = z.object({
  ids: z.array(z.number()),
});

export async function POST(request: Request) {
  try {
    const session = await requireModuleOrRoles('ppdb_data', ['superadmin', 'admin']);
    const actor = actorFromSession(session);

    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const { ids } = result.data;
    if (ids.length === 0) return NextResponse.json({ success: true });

    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, is_printed FROM ppdb_submissions WHERE id IN (${placeholders})`,
      ids
    );
    await pool.execute(`UPDATE ppdb_submissions SET is_printed = 1 WHERE id IN (${placeholders})`, ids);

    for (const row of rows) {
      if (!row.is_printed) {
        await logPpdbActivity({
          ppdbId: Number(row.id),
          action: 'printed',
          field: 'is_printed',
          oldValue: '0',
          newValue: '1',
          note: 'Cetak masal',
          actor,
        });
      }
    }

    revalidatePath('/scp/ppdb');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
