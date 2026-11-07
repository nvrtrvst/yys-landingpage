import { NextResponse } from 'next/server';
import { handleApiError, logError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireModuleOrRoles } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
import { sendPPDBStatusEmail } from '@/lib/mailer';
import { syncPpdbSubmission, deactivatePpdbStudent } from '@/lib/sim-sync';
import { actorFromSession, logPpdbActivity } from '@/lib/ppdb-activity';

const updateSchema = z.object({
  status: z.enum(['Proses', 'Diterima', 'Ditolak', 'pending', 'diterima', 'ditolak']).nullable().optional(),
  is_printed: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireModuleOrRoles('ppdb_data', ['superadmin', 'admin']);
    const actor = actorFromSession(session);

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    const updates = [];
    const values = [];
    let newStatus: string | null = null;

    const [currentRows] = await pool.execute<RowDataPacket[]>(
      'SELECT status, sync_status, is_printed FROM ppdb_submissions WHERE id = ?',
      [(await params).id]
    );
    const previous = currentRows[0];
    if (!previous) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    if (data.status) {
      let dbStatus = data.status;
      if (dbStatus === 'pending' || dbStatus === 'Proses') dbStatus = 'Proses';
      if (dbStatus === 'diterima' || dbStatus === 'Diterima') dbStatus = 'Diterima';
      if (dbStatus === 'ditolak' || dbStatus === 'Ditolak') dbStatus = 'Ditolak';
      newStatus = dbStatus;
      updates.push('status = ?');
      values.push(dbStatus);
    }
    if (data.is_printed !== undefined) {
      updates.push('is_printed = ?');
      values.push(data.is_printed ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push((await params).id);
      await pool.execute(`UPDATE ppdb_submissions SET ${updates.join(', ')} WHERE id = ?`, values);

      const idNum = Number((await params).id);
      if (data.status && previous?.status !== newStatus) {
        await logPpdbActivity({
          ppdbId: idNum,
          action: 'status_changed',
          field: 'status',
          oldValue: previous?.status ?? null,
          newValue: newStatus,
          actor,
        });
      }
      if (data.is_printed !== undefined) {
        const oldPrinted = previous?.is_printed ? '1' : '0';
        const newPrinted = data.is_printed ? '1' : '0';
        if (oldPrinted !== newPrinted) {
          await logPpdbActivity({
            ppdbId: idNum,
            action: data.is_printed ? 'printed' : 'print_reset',
            field: 'is_printed',
            oldValue: oldPrinted,
            newValue: newPrinted,
            actor,
          });
        }
      }

      if (data.status) {
        try {
          const [rows] = await pool.execute<RowDataPacket[]>('SELECT email, registration_number, student_name, status, unit FROM ppdb_submissions WHERE id = ?', [(await params).id]);
          const applicant = rows[0];
          if (applicant && applicant.email) {
            sendPPDBStatusEmail({
              to: applicant.email,
              registration_number: applicant.registration_number,
              student_name: applicant.student_name,
              status: applicant.status,
              unit: applicant.unit
            }).catch(err => console.error("Failed to send status email:", err));
          }
        } catch (emailErr) {
          console.error("Error preparing status email:", emailErr);
        }
      }
    }

    const idNum = Number((await params).id);
    if (newStatus === 'Diterima' && (previous?.status !== 'Diterima' || previous?.sync_status !== 'success')) {
      void syncPpdbSubmission(idNum, { force: true, actor, trigger: 'auto' }).catch((error) => logError(error, 'Auto sync PPDB'));
    } else if (previous?.status === 'Diterima' && newStatus !== null && newStatus !== 'Diterima') {
      void deactivatePpdbStudent(idNum, actor).catch((error) => logError(error, 'Deactivate PPDB'));
    }

    revalidatePath('/scp/ppdb');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleOrRoles('ppdb_data', ['superadmin', 'admin']);

    const [rows] = await pool.execute<RowDataPacket[]>('SELECT id, registration_number, status, sync_status, unit, grade, major, student_name, nisn, nik, birth_place, birth_date, gender, religion, address, child_order, siblings_count, previous_school, is_pip, father_name, father_job, mother_name, mother_job, guardian_name, guardian_job, phone, email, student_photo, kk_document, birth_cert_document, diploma_document, created_at, is_printed, updated_at, updated_by_name, last_action, sync_warning, sync_error, synced_at, sync_attempts, sync_external_id, sync_class_id, sync_class_name FROM ppdb_submissions WHERE id = ?', [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    return NextResponse.json(rows[0]);
  } catch (error) {
    return handleApiError(error);
  }
}
