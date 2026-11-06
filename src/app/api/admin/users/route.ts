import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendNewUserEmail } from '@/lib/mailer';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { rateLimitOrThrow, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';
import { sanitizePetugasPermissions } from '@/lib/modules';

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(['superadmin', 'admin', 'editor', 'admin_unit', 'guru', 'siswa', 'petugas']),
  permissions: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    await requireRole(['superadmin', 'admin']);

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, email, role, permissions, created_at FROM users ORDER BY created_at DESC'
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(['superadmin', 'admin']);

    rateLimitOrThrow(`admin:users:${getClientIp(request)}`, 10, 60 * 1000);

    const body = await request.json();
    const valid = createUserSchema.safeParse(body);
    if (!valid.success) {
      return NextResponse.json({ error: 'Data tidak valid', details: valid.error.issues }, { status: 400 });
    }
    const { name, email, password, role } = valid.data;
    const permissions =
      role === 'petugas' ? JSON.stringify(sanitizePetugasPermissions(valid.data.permissions)) : null;

    if (role === 'superadmin' && session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Dilarang' }, { status: 403 });
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.execute(
      'INSERT INTO users (name, email, password, role, permissions) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, permissions]
    );

    // Generate a one-time setup token and email a "set password" link
    // instead of sending the plaintext password.
    const setupToken = crypto.randomBytes(32).toString('hex');
    await pool.execute<ResultSetHeader>(
      'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
      [email, setupToken]
    );

    await sendNewUserEmail({
      to: email,
      name,
      role,
      token: setupToken
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating user:', error);
    return handleApiError(error);
  }
}
