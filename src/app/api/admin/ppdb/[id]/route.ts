import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { sendPPDBStatusEmail } from '@/lib/mailer';

const updateSchema = z.object({
  status: z.enum(['Proses', 'Diterima', 'Ditolak', 'pending', 'diterima', 'ditolak']).nullable().optional(),
  sync_status: z.enum(['pending', 'success', 'failed']).nullable().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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

    if (updates.length > 0) {
      values.push((await params).id);
      await pool.execute(`UPDATE ppdb_submissions SET ${updates.join(', ')} WHERE id = ?`, values);

      if (data.status) {
        try {
          const [rows] = await pool.execute('SELECT email, registration_number, student_name, status, unit FROM ppdb_submissions WHERE id = ?', [(await params).id]);
          const applicant = (rows as any[])[0];
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

    revalidatePath('/scp/ppdb');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [rows] = await pool.execute('SELECT * FROM ppdb_submissions WHERE id = ?', [(await params).id]);
    if ((rows as any[]).length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    return NextResponse.json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
