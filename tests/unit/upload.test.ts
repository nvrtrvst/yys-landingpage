import { describe, it, expect, vi } from 'vitest';

vi.mock('sharp', () => ({ default: vi.fn() }));

import { uploadFile } from '@/lib/upload';

describe('uploadFile', () => {
  it('rejects disallowed mime types', async () => {
    const file = new File([Buffer.from('hello')], 'note.txt', { type: 'text/plain' });
    await expect(uploadFile(file)).resolves.toEqual({
      success: false,
      error: 'Tipe file tidak valid.',
    });
  });

  it('rejects files above the size limit', async () => {
    const file = new File([Buffer.alloc(16)], 'photo.png', { type: 'image/png' });
    const result = await uploadFile(file, 'uploads', ['image/png'], 0);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Ukuran file');
  });

  it('rejects files whose magic bytes do not match the claimed type', async () => {
    const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const file = new File([jpegBytes], 'photo.png', { type: 'image/png' });
    const result = await uploadFile(file, 'uploads', ['image/png'], 10);
    expect(result.success).toBe(false);
    expect(result.error).toBe('File tidak sesuai dengan tipe yang diklaim.');
  });
});
