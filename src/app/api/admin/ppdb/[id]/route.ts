import { NextResponse } from 'next/server';
import { handleApiError, logError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
import { sendPPDBStatusEmail } from '@/lib/mailer';
import { syncPpdbSubmission } from '@/lib/sim-sync';

const updateSchema = z.object({
  status: z.enum(['Proses', 'Diterima', 'Ditolak', 'pending', 'diterima', 'ditolak']).nullable().optional(),
  sync_status: z.enum(['pending', 'success', 'failed']).nullable().optional(),
  is_printed: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['superadmin', 'admin']);

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const data = result.data;
    const updates = [];
    const values = [];

    if (data.status) {
      let dbStatus = data.status;
      if (dbStatus === 'pending' || dbStatus === 'Proses') dbStatus = 'Proses';
      if (dbStatus === 'diterima' || dbStatus === 'Diterima') dbStatus = 'Diterima';
      if (dbStatus === 'ditolak' || dbStatus === 'Ditolak') dbStatus = 'Ditolak';
      updates.push('status = ?');
      values.push(dbStatus);
    }
    if (data.sync_status) {
      updates.push('sync_status = ?');
      values.push(data.sync_status);
    }
    if (data.is_printed !== undefined) {
      updates.push('is_printed = ?');
      values.push(data.is_printed ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push((await params).id);
      await pool.execute(`UPDATE ppdb_submissions SET ${updates.join(', ')} WHERE id = ?`, values);

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

    if (data.status === 'Diterima') {
      try {
        await syncPpdbSubmission(Number((await params).id));
      } catch (error) {
        logError(error, 'Auto sync PPDB');
      }
    }

    revalidatePath('/scp/ppdb');
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['superadmin', 'admin']);

    const [rows] = await pool.execute<RowDataPacket[]>('SELECT id, registration_number, status, sync_status, unit, grade, major, student_name, nisn, nik, birth_place, birth_date, gender, religion, address, child_order, siblings_count, previous_school, is_pip, father_name, father_job, mother_name, mother_job, guardian_name, guardian_job, phone, email, student_photo, kk_document, birth_cert_document, diploma_document, created_at, is_printed, sync_warning, sync_error, synced_at, sync_attempts, sync_external_id FROM ppdb_submissions WHERE id = ?', [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    return NextResponse.json(rows[0]);
  } catch (error) {
    return handleApiError(error);
  }
}
