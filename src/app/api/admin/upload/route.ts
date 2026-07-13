import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

function checkMagicNumber(buffer: Buffer): boolean {
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // WebP: RIFF...WEBP
  if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  // PDF: %PDF
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return true;
  
  return false;
}

function isMagicPdf(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const isSiswa = session.user.role === "siswa";
    const isMod = ["superadmin", "admin", "admin_unit", "guru", "editor"].includes(session.user.role);
    if (!isSiswa && !isMod) {
      return NextResponse.json({ error: 'Dilarang' }, { status: 403 });
    }

    const rl = checkRateLimit(`admin:upload:${getClientIp(request)}`, 20, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Ukuran file melebihi batas maksimum 5MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!checkMagicNumber(buffer)) {
      return NextResponse.json({ error: 'Tipe file tidak valid. Hanya JPEG, PNG, dan WebP yang diizinkan.' }, { status: 400 });
    }

    const isPdf = isMagicPdf(buffer);
    if (isPdf && isSiswa) {
      return NextResponse.json({ error: 'Siswa hanya bisa upload gambar.' }, { status: 400 });
    }

    let finalBuffer: Buffer = buffer;
    const ext = isPdf ? 'pdf' : 'webp';
    const filename = `${crypto.randomUUID()}-${Date.now()}.${ext}`;

    if (!isPdf) {
      try {
        finalBuffer = await sharp(buffer)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
      } catch (err) {
        console.error("Sharp processing failed:", err);
        return NextResponse.json({ error: 'Gagal memproses gambar.' }, { status: 400 });
      }
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, filename);
    await writeFile(filePath, finalBuffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    if (/body|limit|too large|exceed|size/i.test(msg)) {
      return NextResponse.json({ error: 'Ukuran file terlalu besar (maksimal 10MB).' }, { status: 413 });
    }
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
