import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Endpoint ini dipanggil oleh frontend CMS (PPDBForm)
// Di belakang layar, ia bertindak sebagai "Middleman" yang menembak API Keuangan
// lalu mengembalikan hasilnya dengan performa tinggi berkat cache.

export async function GET(request: Request) {
  try {
    const rl = checkRateLimit(`ppdb-majors:${getClientIp(request)}`, 30, 60 * 1000);
    if (!rl.allowed) return NextResponse.json({ error: 'Terlalu banyak permintaan' }, { status: 429 });

    const { searchParams } = new URL(request.url);
    const unit = searchParams.get('unit');

    if (!unit) {
      return NextResponse.json({ error: 'Parameter unit diperlukan' }, { status: 400 });
    }

    // 1. Dapatkan URL Keuangan dan Secret Key dari Environment
    const KEUANGAN_URL = process.env.KEUANGAN_API_URL || "http://localhost:3000";
    const API_KEY = process.env.KEUANGAN_INTEGRATION_KEY;

    if (!API_KEY) {
      console.error("CRITICAL: KEUANGAN_INTEGRATION_KEY is missing in CMS .env");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. Fetch data jurusan dari Server Keuangan via HTTP API
    const response = await fetch(`${KEUANGAN_URL}/api/integration/majors?unit=${unit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      // CACHING: Disetel ke 1 jam (3600 detik) agar performa frontend sangat cepat
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Keuangan API Error (${response.status}):`, errText);
      throw new Error("Gagal mengambil data dari server Keuangan");
    }

    // 3. Parsing response dari Keuangan
    const result = await response.json();

    // 4. Kirim ke Frontend (Browser)
    return NextResponse.json({ success: true, data: result.data || [] });
    
  } catch(error: unknown) {
    console.error('Error in CMS integration proxy:', (error instanceof Error ? error.message : String(error)));
    return NextResponse.json({ error: 'Gagal menghubungi server pusat' }, { status: 500 });
  }
}
