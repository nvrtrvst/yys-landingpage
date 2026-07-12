import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

function checkMagic(buffer: Buffer, type: string): boolean {
  if (type === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (type === 'image/png') {
    return buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (type === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    );
  }
  if (type === 'application/pdf') {
    return buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }
  return false;
}

export async function uploadFile(
  file: File,
  directory: string = 'uploads',
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSizeMB: number = 2
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipe file tidak valid.' };
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return { success: false, error: `Ukuran file melebihi ${maxSizeMB}MB.` };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validasi magic-byte (bukan hanya MIME dari header yang mudah dipalsukan)
    if (!checkMagic(buffer, file.type)) {
      return { success: false, error: 'File tidak sesuai dengan tipe yang diklaim.' };
    }

    const isPdf = file.type === 'application/pdf';
    const uploadDir = path.join(process.cwd(), 'public', directory);
    await mkdir(uploadDir, { recursive: true });

    const base = crypto.randomBytes(16).toString('hex');

    if (isPdf) {
      const filename = `${base}.pdf`;
      await writeFile(path.join(uploadDir, filename), buffer);
      return { success: true, url: `/${directory}/${filename}` };
    }

    // Re-encode ke WebP untuk membuang payload polyglot (XSS/shell lewat image)
    const webp = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const filename = `${base}.webp`;
    await writeFile(path.join(uploadDir, filename), webp);
    return { success: true, url: `/${directory}/${filename}` };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: 'Gagal mengunggah file.' };
  }
}
