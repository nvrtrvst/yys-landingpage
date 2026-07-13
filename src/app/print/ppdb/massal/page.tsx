import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MassPrintPPDBPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // Authentication check (Security: Prevent IDOR)
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/scp/login");
  }

  const { ids } = await searchParams;
  if (!ids || typeof ids !== 'string') {
    return <div className="p-12 text-center text-red-500 font-bold">Parameter IDs tidak ditemukan</div>;
  }

  const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  if (idArray.length === 0) {
    return <div className="p-12 text-center text-red-500 font-bold">Daftar ID tidak valid</div>;
  }

  // 1. Fetch Setting (Schedule & Config)
  interface PpdbSchedule {
    activity: string;
    wave1: string;
    wave2: string;
  }

  let ppdbConfig = {
    academic_year: '2026-2027',
    headmaster_name: '',
    headmaster_nip: '',
    committee_name: '',
    schedules: [] as PpdbSchedule[]
  };
  
  const [settingRows] = await pool.execute<RowDataPacket[]>(
    'SELECT setting_value FROM settings WHERE setting_key = "ppdb_config"'
  );

  if (settingRows.length > 0 && settingRows[0].setting_value) {
    try {
      const parsed = JSON.parse(settingRows[0].setting_value);
      if (parsed) ppdbConfig = { ...ppdbConfig, ...parsed };
    } catch (e) {
      console.error(e);
    }
  }

  // 2. Fetch Students Data
  const placeholders = idArray.map(() => '?').join(',');
  const [studentRows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM ppdb_submissions WHERE id IN (${placeholders})`,
    idArray
  );

  if (studentRows.length === 0) {
    return <div className="p-12 text-center text-red-500 font-bold">Data siswa tidak ditemukan</div>;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-gray-200 min-h-screen pb-12 print:bg-white print:pb-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            margin: 0;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 280mm !important;
            height: 190mm !important;
            margin: 0 auto !important;
            box-sizing: border-box;
            border: none !important;
            box-shadow: none !important;
            page-break-after: always;
          }
          .print-container:last-child {
            page-break-after: auto;
          }
        }
      `}} />

      {/* Action Bar (Not printed) */}
      <div className="no-print bg-gray-100 p-4 flex justify-between items-center border-b mb-8 shadow-sm sticky top-0 z-50">
        <p className="text-sm text-gray-600">Menampilkan <strong>{studentRows.length}</strong> kartu. Tekan <strong>Ctrl+P</strong> atau tombol di kanan untuk mencetak masal.</p>
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 transition flex gap-2 items-center"
        >
          🖨️ Cetak Semua
        </button>
      </div>

      {/* Auto-print script */}
      <script dangerouslySetInnerHTML={{__html: `
        document.querySelector('button').addEventListener('click', () => window.print());
      `}} />

      {/* The Printable Cards */}
      {studentRows.map((student) => (
        <div key={student.id} className="print-container mx-auto w-[280mm] h-[190mm] box-border p-4 bg-white font-sans text-black flex gap-4 shadow-lg mb-8">
          
          {/* LEFT SIDE: SCHEDULE */}
          <div className="w-1/2 border-[3px] border-black p-4 flex flex-col justify-between">
            <div className="text-center font-bold mb-4">
              <h2 className="text-sm">JADWAL KEGIATAN SPMB</h2>
              <h1 className="text-base uppercase">{student.unit} NUURUL MUTTAQIIN CISURUPAN</h1>
              <h2 className="text-sm">TAHUN PELAJARAN {ppdbConfig.academic_year}</h2>
            </div>

            <table className="w-full text-[11px] border-collapse border border-black mb-4 flex-grow">
              <thead>
                <tr className="bg-gray-100 text-center font-bold">
                  <th className="border border-black p-1 w-[40%]">URAIAN KEGIATAN</th>
                  <th className="border border-black p-1 w-[30%]">GELOMBANG 1<br/>HARI/TANGGAL</th>
                  <th className="border border-black p-1 w-[30%]">GELOMBANG 2<br/>HARI/TANGGAL</th>
                </tr>
              </thead>
              <tbody>
                {ppdbConfig.schedules.map((s, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-1.5 font-semibold">{s.activity}</td>
                    <td className="border border-black p-1.5">{s.wave1}</td>
                    <td className="border border-black p-1.5">{s.wave2}</td>
                  </tr>
                ))}
                {ppdbConfig.schedules.length === 0 && (
                  <tr><td colSpan={3} className="text-center p-2 border border-black">Jadwal belum diatur</td></tr>
                )}
              </tbody>
            </table>

            <div className="text-[10px] italic mb-2">Catatan: Jadwal sewaktu-waktu bisa berubah disesuaikan dengan kondisi</div>

            <div className="flex justify-end text-center text-xs mt-2">
              <div className="w-48">
                <p>MENGETAHUI KEPALA:</p>
                <p className="uppercase">{student.unit} NUURUL MUTTAQIIN CISURUPAN</p>
                <div className="h-16 relative my-1">
                  {/* Placeholder for stamp/signature */}
                </div>
                <p className="font-bold underline">{ppdbConfig.headmaster_name || '........................'}</p>
                <p>NIP. {ppdbConfig.headmaster_nip || '........................'}</p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: STUDENT INFO */}
          <div className="w-1/2 border-[3px] border-black p-4 flex flex-col relative">
            
            {/* Header */}
            <div className="flex items-center border-b border-black pb-3 mb-4">
              <div className="w-20 h-20 ml-2 flex items-center justify-center shrink-0">
                <img 
                  src={`/logo/${student.unit?.toLowerCase() || 'logo'}.png`} 
                  alt={`Logo ${student.unit}`} 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="ml-4 text-center flex-grow">
                <h1 className="font-bold text-sm uppercase">{student.unit} NUURUL MUTTAQIIN CISURUPAN</h1>
                <p className="text-[10px]">Jl. Raya Cisurupan No. 160 Cisurupan Garut 44163<br/>Telp / Fax. (0262) 576327</p>
                <h2 className="font-bold text-[13px] mt-2">KARTU PESERTA PEMINATAN JURUSAN<br/>SISTEM PENERIMAAN MURID BARU {ppdbConfig.academic_year}</h2>
              </div>
            </div>

            {/* Biodata Table */}
            <div className="flex gap-4 flex-grow">
              <table className="text-xs font-bold w-full h-fit">
                <tbody>
                  <tr>
                    <td className="py-1 w-32 uppercase">NO. PESERTA</td>
                    <td className="py-1 w-2">:</td>
                    <td className="py-1">{student.registration_number}</td>
                  </tr>
                  <tr>
                    <td className="py-1 uppercase">NAMA LENGKAP</td>
                    <td className="py-1">:</td>
                    <td className="py-1 uppercase">{student.student_name}</td>
                  </tr>
                  <tr>
                    <td className="py-1 uppercase">TEMPAT/TGL LAHIR</td>
                    <td className="py-1">:</td>
                    <td className="py-1 uppercase">{student.birth_place}, {formatDate(student.birth_date)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 uppercase align-top">ALAMAT</td>
                    <td className="py-1 align-top">:</td>
                    <td className="py-1 uppercase pr-2 leading-tight">{student.address}</td>
                  </tr>
                  <tr>
                    <td className="py-1 uppercase">NO.HP/WA</td>
                    <td className="py-1">:</td>
                    <td className="py-1 uppercase">{student.phone}</td>
                  </tr>
                  <tr>
                    <td className="py-1 uppercase">ASAL SEKOLAH</td>
                    <td className="py-1">:</td>
                    <td className="py-1 uppercase">{student.previous_school || '-'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Photo Box */}
              <div className="shrink-0 flex flex-col items-center ml-2 pt-2">
                <div className="w-24 h-32 border-2 border-black flex items-center justify-center relative overflow-hidden bg-gray-100">
                  {student.student_photo ? (
                    <img src={student.student_photo} alt="Foto Siswa" className="object-cover w-full h-full absolute inset-0" />
                  ) : (
                    <span className="text-xs font-bold text-gray-400">FOTO<br/>2x3</span>
                  )}
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between text-center text-xs mt-auto pt-4">
              <div className="w-32">
                <p>Panitia Pendaftaran</p>
                <div className="h-16 relative my-1"></div>
                <p className="font-bold underline uppercase">{ppdbConfig.committee_name || '........................'}</p>
              </div>
              <div className="w-32">
                <p>Peserta,</p>
                <div className="h-16 relative my-1"></div>
                <p className="font-bold underline uppercase">{student.student_name}</p>
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}
