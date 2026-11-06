import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { rateLimitOrThrow, getClientIp } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/errors';
import { syncPpdbSubmission } from '@/lib/sim-sync';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['superadmin', 'admin']);
    rateLimitOrThrow(`ppdb-sync:${getClientIp(request)}`, 20, 60_000);

    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: 'ID tidak valid' }, { status: 400 });
    }

    const result = await syncPpdbSubmission(id, { force: true });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
