import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";

export default async function PPDBStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const regNumber = typeof params.reg === 'string' ? params.reg : '';

  let submission: RowDataPacket | null = null;
  let searched = false;

  if (regNumber) {
    searched = true;
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT * FROM ppdb_submissions WHERE registration_number = ?",
        [regNumber]
      );
      if (rows.length > 0) {
        submission = rows[0];
      }
    } catch (error) {
      console.error("Failed to search PPDB status", error);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-primary-900 pb-20">
        <Header />
        <div className="pt-32 pb-10 text-center text-white px-4">
          <h1 className="font-serif text-4xl font-bold mb-4">Cek Status PPDB</h1>
          <p className="text-primary-100 max-w-2xl mx-auto">
            Masukkan Nomor Pendaftaran Anda untuk melihat status kelulusan.
          </p>
        </div>
      </div>

      <div className="flex-1 -mt-16 mb-20 px-4 md:px-0">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            
            <form method="GET" action="/ppdb/status" className="flex flex-col md:flex-row gap-4 mb-8">
              <input 
                type="text" 
                name="reg" 
                defaultValue={regNumber}
                placeholder="Masukkan Nomor Pendaftaran (cth: PPDB-2024-...)" 
                className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-lg"
                required
              />
              <button type="submit" className="px-8 py-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition shadow-lg">
                Cek Status
              </button>
            </form>

            {searched && (
              <div className="border-t border-gray-100 pt-8 mt-4">
                {submission ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">Hasil Pencarian</h3>
                      <span className={`px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider ${
                        submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                        submission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {submission.status === 'approved' ? 'LULUS / DITERIMA' :
                         submission.status === 'rejected' ? 'TIDAK DITERIMA' : 'SEDANG DIPROSES'}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <span className="text-gray-500 font-medium">No. Pendaftaran</span>
                        <span className="col-span-2 font-bold text-gray-900">{submission.registration_number}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <span className="text-gray-500 font-medium">Nama Siswa</span>
                        <span className="col-span-2 font-medium text-gray-900">{submission.student_name}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <span className="text-gray-500 font-medium">Unit & Kelas</span>
                        <span className="col-span-2 font-medium text-gray-900">{submission.unit} - Kelas {submission.grade} {submission.major && `(${submission.major})`}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <span className="text-gray-500 font-medium">Tanggal Daftar</span>
                        <span className="col-span-2 font-medium text-gray-900">{new Date(submission.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                      </div>
                    </div>

                    {submission.status === 'approved' && (
                      <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-green-800">
                        <h4 className="font-bold text-lg mb-2">Selamat! Anda Dinyatakan Lulus.</h4>
                        <p>Silakan melakukan proses daftar ulang dengan datang langsung ke tata usaha unit sekolah tujuan atau menghubungi panitia PPDB kami.</p>
                      </div>
                    )}
                    {submission.status === 'pending' && (
                      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl text-yellow-800">
                        <h4 className="font-bold text-lg mb-2">Data Sedang Diverifikasi</h4>
                        <p>Tim panitia sedang melakukan pengecekan data Anda. Silakan cek kembali halaman ini secara berkala.</p>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✕</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Data Tidak Ditemukan</h3>
                    <p className="text-gray-600">Nomor pendaftaran "{regNumber}" tidak terdaftar dalam sistem kami. Pastikan nomor yang dimasukkan sudah benar.</p>
                  </div>
                )}
              </div>
            )}

            <div className="text-center mt-8">
              <Link href="/ppdb" className="text-primary-600 font-medium hover:underline">&larr; Kembali ke Form Pendaftaran</Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
