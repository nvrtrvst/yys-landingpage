import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import mysqldump from 'mysqldump';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden — only superadmin' }, { status: 403 });

    const rl = checkRateLimit(`admin:backup:${getClientIp(request)}`, 5, 60 * 1000);
    if (!rl.allowed) return NextResponse.json({ error: 'Terlalu banyak permintaan' }, { status: 429 });

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

    // Run mysqldump and output to the temp file
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

    // Read file contents as a buffer
    const fileBuffer = await fs.readFile(tmpFilePath);
    
    // Cleanup temporary file
    await fs.unlink(tmpFilePath).catch(console.error);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch(error: unknown) {
    console.error('Database backup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
