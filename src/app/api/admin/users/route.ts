import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendNewUserEmail } from '@/lib/mailer';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(['superadmin', 'admin', 'editor', 'admin_unit', 'guru', 'siswa']),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const sessionRole = session.user.role;
    // Only superadmin and admin can create users
    if (sessionRole !== 'superadmin' && sessionRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = checkRateLimit(`admin:users:${getClientIp(request)}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 });
    }

    const body = await request.json();
    const valid = createUserSchema.safeParse(body);
    if (!valid.success) {
      return NextResponse.json({ error: 'Data tidak valid', details: valid.error.issues }, { status: 400 });
    }
    const { name, email, password, role } = valid.data;

    // Check if email already exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
