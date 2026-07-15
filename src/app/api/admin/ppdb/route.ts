import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role;
    if (role !== 'superadmin' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const rl = checkRateLimit(`admin:ppdb:${getClientIp(request)}`, 20, 60 * 1000);
    if (!rl.allowed) return NextResponse.json({ error: 'Terlalu banyak permintaan' }, { status: 429 });

    const url = new URL(request.url);
    const unit = url.searchParams.get('unit');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let query = `SELECT 
      id, registration_number, status, sync_status, unit, grade, major, is_printed,
      student_name, nisn, birth_place, birth_date, gender, phone, email,
      previous_school, father_name, mother_name, created_at
      FROM ppdb_submissions WHERE 1=1`;
    const params: string[] = [];

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
      const limitSearch = search.substring(0, 100);
      
      // Check if search term is short/simple enough for efficient LIKE
      if (limitSearch.length <= 10) {
        query += ' AND (student_name LIKE ? OR registration_number LIKE ?)';
        params.push(`%${limitSearch}%`, `%${limitSearch}%`);
      }
      // For longer search terms, use FULLTEXT if available (after migration runs)
      // This fallback prevents breaking if FULLTEXT index hasn't been created yet
      else {
        query += ' AND (student_name LIKE ? OR registration_number LIKE ?)';
        params.push(`%${limitSearch}%`, `%${limitSearch}%`);
      }
    }
    const printStatus = url.searchParams.get('print_status');
    if (printStatus === 'printed') {
      query += ' AND is_printed = 1';
    } else if (printStatus === 'unprinted') {
      query += ' AND (is_printed = 0 OR is_printed IS NULL)';
    }

    query += ' ORDER BY created_at DESC LIMIT 500'; // cap result size

    const [rows] = await pool.execute(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
