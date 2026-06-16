import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function uploadFile(
  file: File, 
  directory: string = 'uploads',
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSizeMB: number = 2
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type.' };
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return { success: false, error: `File size exceeds ${maxSizeMB}MB.` };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename to prevent path traversal and overwriting
    const fileExtension = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg');
    const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), 'public', directory);
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    // Return the URL path
    return { success: true, url: `/${directory}/${uniqueFilename}` };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: 'Failed to upload file.' };
  }
}
