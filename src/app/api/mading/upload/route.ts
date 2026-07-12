import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { madingAuthOptions } from '@/lib/mading-auth';
import { uploadFile } from '@/lib/upload';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(madingAuthOptions);
    if (!session) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const rl = checkRateLimit(`mading:upload:${getClientIp(request)}`, 20, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    const result = await uploadFile(
      file,
      'uploads',
      ['image/jpeg', 'image/png', 'image/webp'],
      10
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Gagal mengunggah file.' }, { status: 400 });
    }

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error('Mading upload error:', error);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}
