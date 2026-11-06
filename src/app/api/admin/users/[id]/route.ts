import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import bcrypt from 'bcrypt';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { rateLimitOrThrow, getClientIp } from '@/lib/rate-limit';
import { sanitizePetugasPermissions } from '@/lib/modules';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['superadmin', 'admin']);

    rateLimitOrThrow(`admin:user-edit:${getClientIp(request)}`, 20, 60 * 1000);

    const { id } = await params;
    const { name, email, password, role, permissions: rawPermissions } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Nama, Email, dan Role wajib diisi' }, { status: 400 });
    }

    const allowedRoles = ['superadmin', 'admin', 'editor', 'admin_unit', 'guru', 'siswa', 'petugas'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
    }

    const [targetRows] = await pool.execute<RowDataPacket[]>('SELECT role FROM users WHERE id = ?', [id]);
    if (targetRows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    if (
      session.user.role !== 'superadmin' &&
      (role === 'superadmin' || targetRows[0].role === 'superadmin')
    ) {
      return NextResponse.json({ error: 'Dilarang' }, { status: 403 });
    }

    const permissions =
      role === 'petugas' ? JSON.stringify(sanitizePetugasPermissions(rawPermissions)) : null;

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar untuk pengguna lain' }, { status: 400 });
    }

    if (password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, password = ?, role = ?, permissions = ? WHERE id = ?',
        [name, email, hashedPassword, role, permissions, id]
      );
    } else {
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, role = ?, permissions = ? WHERE id = ?',
        [name, email, role, permissions, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['superadmin', 'admin']);
    const sessionId = session.user.id;

    rateLimitOrThrow(`admin:user-delete:${getClientIp(request)}`, 20, 60 * 1000);

    const { id } = await params;

    // Prevent deleting oneself
    if (id === sessionId) {
      return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return handleApiError(error);
  }
}
