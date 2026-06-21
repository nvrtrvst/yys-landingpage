import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const url = new URL(request.url);
    const unit = url.searchParams.get('unit');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let query = `SELECT 
      id, registration_number, status, sync_status, unit, grade, major,
      student_name, nisn, birth_place, birth_date, gender, phone, email,
      previous_school, father_name, mother_name, created_at
      FROM ppdb_submissions WHERE 1=1`;
    const params: any[] = [];

    if (unit) {
      // Validate unit against allowed values to prevent unexpected input
      const allowedUnits = ['LPQ', 'TK', 'SD', 'SMP', 'SMK'];
      if (!allowedUnits.includes(unit)) return NextResponse.json({ error: 'Invalid unit filter' }, { status: 400 });
      query += ' AND unit = ?';
      params.push(unit);
    }
    if (status) {
      // Validate status against allowed values
      const allowedStatuses = ['Proses', 'Diterima', 'Ditolak'];
      if (!allowedStatuses.includes(status)) return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (student_name LIKE ? OR registration_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT 500'; // cap result size

    const [rows] = await pool.execute(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
