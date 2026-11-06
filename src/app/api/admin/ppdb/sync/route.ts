import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { rateLimitOrThrow, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/errors';
import { syncPpdbSubmission } from '@/lib/sim-sync';
import { actorFromSession } from '@/lib/ppdb-activity';

const MAX_BATCH = 20;

export async function POST(request: Request) {
  try {
    const session = await requireModuleOrRoles('ppdb_data', ['superadmin', 'admin']);
    const actor = actorFromSession(session);
    rateLimitOrThrow(`ppdb-sync-bulk:${getClientIp(request)}`, 5, 60_000);

    const body = await request.json().catch(() => ({}));
    const requested: number[] = Array.isArray(body?.ids)
      ? body.ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0)
      : [];
    const statuses: string[] =
      Array.isArray(body?.statuses) && body.statuses.length > 0 ? body.statuses : ['pending', 'failed'];

    let ids = requested;
    if (ids.length === 0) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id FROM ppdb_submissions
         WHERE status = 'Diterima' AND sync_status IN (${statuses.map(() => '?').join(',')})
         ORDER BY id DESC LIMIT ${MAX_BATCH}`,
        statuses
      );
      ids = rows.map((row) => Number(row.id));
    }
    ids = ids.slice(0, MAX_BATCH);

    let success = 0;
    let alreadyExists = 0;
    let skipped = 0;
    let failed = 0;

    for (const id of ids) {
      const result = await syncPpdbSubmission(id, { force: true, actor, trigger: 'manual' });
      if (result.skipped) skipped++;
      else if (result.ok) {
        if (result.alreadyExists) alreadyExists++;
        else success++;
      } else failed++;
    }

    return NextResponse.json({
      success: true,
      summary: { total: ids.length, success, alreadyExists, skipped, failed },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
