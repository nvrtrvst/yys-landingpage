import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import nodemailer from 'nodemailer';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { pdfBase64 } = body;

    if (!pdfBase64) {
      return NextResponse.json({ error: 'Data PDF tidak ditemukan' }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>('SELECT email, student_name, registration_number FROM ppdb_submissions WHERE id = ?', [id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Student Not Found' }, { status: 404 });

    const student = rows[0];
    if (!student.email) {
      return NextResponse.json({ error: 'Siswa tidak memiliki alamat email yang valid' }, { status: 400 });
    }

    // Process base64
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: '"Panitia PPDB" <no-reply@nuurulmuttaqiin.or.id>',
      to: student.email,
      subject: `Kartu Peserta PPDB - ${student.student_name}`,
      text: `Halo ${student.student_name},\n\nTerlampir adalah Kartu Peserta PPDB Anda (No. ${student.registration_number}).\nMohon dicetak dan dibawa saat proses selanjutnya.\n\nTerima kasih,\nPanitia PPDB`,
      attachments: [
        {
          filename: `Kartu_PPDB_${student.registration_number}.pdf`,
          content: buffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch(error: unknown) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
