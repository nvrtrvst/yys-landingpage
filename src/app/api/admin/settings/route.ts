import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import pool from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { RowDataPacket } from 'mysql2';

const settingsSchema = z.record(z.string(), z.string().nullable());

export async function GET(request: Request) {
  try {
    await requireRole(['superadmin', 'admin']);

    const [rows] = await pool.execute<RowDataPacket[]>('SELECT setting_key, setting_value FROM settings');
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET Error:', error);
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(['superadmin', 'admin']);

    const rl = checkRateLimit(`admin:settings:${getClientIp(request)}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 });
    }

    const body = await request.json();
    const result = settingsSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const updates = result.data;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) continue; // Skip null values if any
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, value, value]
        );
      }
      
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    // Trigger revalidation for homepage where settings are displayed
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return handleApiError(error);
  }
}
