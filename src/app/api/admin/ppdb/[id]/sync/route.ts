import { NextResponse } from 'next/server';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { rateLimitOrThrow, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/errors';
import { syncPpdbSubmission } from '@/lib/sim-sync';
import { actorFromSession } from '@/lib/ppdb-activity';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('ppdb_data', ['superadmin', 'admin']);
    rateLimitOrThrow(`ppdb-sync:${getClientIp(request)}`, 20, 60_000);

    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: 'ID tidak valid' }, { status: 400 });
    }

    const result = await syncPpdbSubmission(id, { force: true, actor: actorFromSession(session), trigger: 'manual' });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
