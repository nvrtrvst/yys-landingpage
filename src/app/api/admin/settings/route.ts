import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const settingsSchema = z.record(z.string(), z.string().nullable());

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const [rows] = await pool.execute('SELECT setting_key, setting_value FROM settings');
    const settings: Record<string, string> = {};
    (rows as any[]).forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = (session.user as any)?.role;
    if (role !== 'superadmin' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
