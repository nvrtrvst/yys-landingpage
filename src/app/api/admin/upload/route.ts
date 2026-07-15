import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { AuthenticationError, ForbiddenError, ValidationError, FileTooLargeError, handleApiError, logError } from '@/lib/errors';

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

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
const MAX_FILE_SIZE_DISPLAY = process.env.MAX_FILE_SIZE_DISPLAY || '10MB';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new AuthenticationError();

    const isSiswa = session.user.role === "siswa";
    const isMod = ["superadmin", "admin", "admin_unit", "guru", "editor"].includes(session.user.role);
    if (!isSiswa && !isMod) throw new ForbiddenError();

    const rl = checkRateLimit(`admin:upload:${getClientIp(request)}`, 20, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) throw new ValidationError('File tidak ditemukan');

    if (file.size > MAX_FILE_SIZE) throw new FileTooLargeError(MAX_FILE_SIZE_DISPLAY);

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!checkMagicNumber(buffer)) {
      throw new ValidationError('Tipe file tidak valid. Hanya JPEG, PNG, dan WebP yang diizinkan.');
    }

    const isPdf = isMagicPdf(buffer);
    if (isPdf && isSiswa) throw new ValidationError('Siswa hanya bisa upload gambar.');

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
        logError(err, 'Sharp processing');
        throw new ValidationError('Gagal memproses gambar.');
      }
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, filename);
    await writeFile(filePath, finalBuffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (/body|limit|too large|exceed|size/i.test(msg)) {
      throw new FileTooLargeError(MAX_FILE_SIZE_DISPLAY);
    }
    if (error instanceof Error) logError(error, 'Upload');
    return handleApiError(error);
  }
}
