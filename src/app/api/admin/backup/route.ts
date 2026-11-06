import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { requireRole } from '@/lib/api-auth';
import { rateLimitOrThrow, getClientIp } from '@/lib/rate-limit';
import mysqldump from 'mysqldump';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET(request: Request) {
  try {
    await requireRole(['superadmin']);

    rateLimitOrThrow(`admin:backup:${getClientIp(request)}`, 5, 60 * 1000);

    // Parse the DATABASE_URL to get connection details
    // Format: mysql://user:password@host:port/database
    const dbUrl = process.env.DATABASE_URL || '';
    let host = 'localhost';
    let user = 'root';
    let password = '';
    let database = 'yayasan_db';
    let port = 3306;

    if (dbUrl) {
      const urlPattern = /^mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)$/;
      const match = dbUrl.match(urlPattern);
      if (match) {
        user = match[1];
        password = match[2];
        host = match[3];
        port = parseInt(match[4], 10);
        database = match[5];
      }
    }

    const tmpDir = os.tmpdir();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `backup_${database}_${dateStr}.bak`;
    const tmpFilePath = path.join(tmpDir, filename);

    await mysqldump({
      connection: {
        host,
        user,
        password,
        database,
        port
      },
      dumpToFile: tmpFilePath,
    });

    const fileBuffer = await fs.readFile(tmpFilePath);
    
    await fs.unlink(tmpFilePath).catch(console.error);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch(error: unknown) {
    console.error('Database backup error:', error);
    return handleApiError(error);
  }
}
