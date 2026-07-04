import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PrintPPDBPage({ params }: { params: Promise<{ id: string }> }) {
  // Authentication check (Security: Prevent IDOR)
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/scp/login");
  }

  const { id } = await params;

  // 1. Fetch Student Data
  const [studentRows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM ppdb_submissions WHERE id = ?',
    [id]
  );
  if (studentRows.length === 0) {
    return <div className="p-10 text-center font-bold text-red-500">Data pendaftar tidak ditemukan.</div>;
  }
  const student = studentRows[0];

  // 2. Fetch Global Settings (PPDB Config)
  const [settingRows] = await pool.execute<RowDataPacket[]>(
    'SELECT setting_value FROM settings WHERE setting_key = "ppdb_config"'
  );
  
  let ppdbConfig = {
    academic_year: "2026-2027",
    headmaster_name: "",
    committee_name: "",
    schedules: [] as any[]
  };

  if (settingRows.length > 0 && settingRows[0].setting_value) {
    try {
      const parsed = JSON.parse(settingRows[0].setting_value);
      if (parsed) ppdbConfig = { ...ppdbConfig, ...parsed };
    } catch (e) {
      console.error(e);
    }
  }

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Toolbar - Only visible on screen */}
      <div className="no-print bg-gray-100 p-4 flex justify-between items-center border-b mb-8 shadow-sm">
        <p className="text-sm text-gray-600">Tekan <strong>Ctrl+P</strong> atau tombol di kanan untuk mencetak.</p>
        <button 
          onClick="window.print()" 
          // Injecting onclick directly via dangerouslySetInnerHTML isn't React way, we'll use a small script block or just rely on the user.
          // Wait, server component can't have onClick. We will add a small client script to auto-print.
          className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition"
        >
          🖨️ Cetak Sekarang
        </button>
      </div>

      {/* Auto-print script */}
      <script dangerouslySetInnerHTML={{__html: `
        document.querySelector('button').addEventListener('click', () => window.print());
        // setTimeout(() => window.print(), 500); // Optional auto print
      `}} />

      {/* The Printable Card Container */}
      <div className="print-container mx-auto w-[280mm] h-[190mm] box-border p-4 bg-white font-sans text-black flex gap-4">
        
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
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: BIODATA */}
        <div className="w-1/2 border-[3px] border-black p-4 flex flex-col relative">
          
          {/* Header */}
          <div className="flex items-center border-b border-black pb-3 mb-4">
            <div className="w-20 h-20 ml-2 flex items-center justify-center shrink-0">
              {/* @ts-ignore - Supress onError warning for Server Component if any, but standard img is fine */}
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

          {/* Student Info */}
          <div className="flex-grow flex gap-4 text-xs font-semibold">
            {/* Table-like info */}
            <div className="flex-grow">
              <table className="w-full">
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
                    <td className="py-1">{student.phone}</td>
                  </tr>
                  <tr>
                    <td className="py-1 uppercase">SEKOLAH ASAL</td>
                    <td className="py-1">:</td>
                    <td className="py-1 uppercase">{student.previous_school}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Photo Box */}
            <div className="w-24 shrink-0 flex flex-col gap-2">
              <div className="w-24 h-32 border border-black flex items-center justify-center relative bg-gray-50 overflow-hidden">
                {student.student_photo ? (
                  <img src={student.student_photo} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">FOTO<br/>2 X 3</span>
                )}
              </div>
              <div className="border-[2px] border-black text-center p-1 mt-4">
                <div className="text-[10px] font-bold">RUANG</div>
                <div className="text-3xl font-bold">{student.room || '...'}</div>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="flex justify-between items-end mt-4 text-xs">
            {/* Barcode Area Placeholder */}
            <div className="w-32 h-10 border border-gray-400 flex items-center justify-center relative">
               {/* In a real app we could use a barcode library, for now we just use a styled div to look like one */}
               <div className="w-full h-full flex flex-col justify-between px-2 py-1">
                 <div className="flex justify-between w-full h-6 space-x-0.5">
                   {Array.from({length: 20}).map((_, i) => (
                     <div key={i} className={`h-full bg-black ${i%3===0 ? 'w-1' : 'w-0.5'}`}></div>
                   ))}
                 </div>
                 <div className="text-[8px] text-center tracking-widest">{student.registration_number}</div>
               </div>
            </div>

            <div className="text-center">
              <p className="mb-8">Garut, ........................<br/>KETUA PANITIA,</p>
              <p className="font-bold underline uppercase">{ppdbConfig.committee_name || '........................'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
