"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Head from "next/head";

export default function PrintKelulusanPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Diterima");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("status") || "Diterima";
    setStatusFilter(s);

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/ppdb?status=${s}`);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
             throw new Error("Akses ditolak. Anda harus login sebagai admin.");
          }
          throw new Error("Gagal memuat data kelulusan");
        }
        const json = await res.json();
        setData(json);
        
        // Auto trigger print when data is loaded
        setTimeout(() => {
          window.print();
        }, 1000);
      } catch(err: unknown) {
        toast.error((err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xl font-bold font-sans">Menyiapkan dokumen cetak...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="p-12 text-center font-sans">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Tidak ada data</h2>
        <p>Belum ada pendaftar dengan status "{statusFilter}" untuk dicetak.</p>
        <button onClick={() => window.close()} className="mt-4 bg-gray-200 px-4 py-2 rounded font-medium">Tutup Halaman</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 min-h-screen pb-12 font-serif text-black">
      <Head>
        <title>Cetak Surat Kelulusan</title>
      </Head>

      {/* Tombol Print (Sembunyi saat dicetak) */}
      <div className="print:hidden p-4 bg-white flex justify-center gap-4 border-b sticky top-0 z-10 shadow-sm mb-8 font-sans">
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-semibold">
          Cetak Sekarang (Print)
        </button>
        <button onClick={() => window.close()} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded shadow font-semibold">
          Tutup Tab
        </button>
      </div>

      <div className="print-container flex flex-col items-center gap-8">
        {data.map((siswa, index) => (
          <div key={siswa.id} className="print-page w-[210mm] min-h-[297mm] box-border bg-white pt-[1.2cm] px-[2.54cm] pb-[2.54cm] shadow-xl relative mx-auto" style={{ pageBreakAfter: "always" }}>
            
            {/* KOP SURAT */}
            <div className="border-b-[3px] border-black pb-4 mb-1 flex items-center justify-between">
              {/* Tempat logo */}
              <div className="w-24 h-24 flex items-center justify-center flex-shrink-0 mr-2">
                <img 
                  src={`/logo/${siswa.unit?.toLowerCase() || 'logo'}.png`} 
                  alt={`Logo ${siswa.unit}`} 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.src = "/logo/logo.png"; }}
                />
              </div>
              
              <div className="flex-1 text-center">
                <h2 className="text-md font-bold uppercase tracking-wider text-black whitespace-nowrap">Sistem Penerimaan Peserta Murid Baru (SPMB)</h2>
                <h2 className="text-md font-bold uppercase tracking-wider text-black">{siswa.unit} Nuurul Muttaqiin</h2>  
                <p className="text-sm mt-1 text-black">Jl. Raya Cisurupan no 154, Kec. Cisurupan, Kab. Garut, Prov. Jawa Barat</p>
                <p className="text-sm text-black">Email: info@nuurulmuttaqiin.or.id | Web: nuurulmuttaqiin.or.id | telp: 0262-577358</p>
              </div>

              <div className="w-20 flex-shrink-0"></div> {/* Spacer for centering */}
            </div>
            {/* Garis Ganda Bawah Kop */}
            <div className="border-b-[1px] border-black mb-8"></div>

            {/* Nomor dan Perihal */}
            <div className="flex justify-between mb-8 text-[12pt] leading-relaxed">
              <div>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="pr-4 align-top">Nomor</td>
                      <td className="px-1 align-top">:</td>
                      <td className="font-medium">{siswa.id}/PPDB-YNM/{new Date().getFullYear()}</td>
                    </tr>
                    <tr>
                      <td className="pr-4 align-top">Lampiran</td>
                      <td className="px-1 align-top">:</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td className="pr-4 align-top">Perihal</td>
                      <td className="px-1 align-top">:</td>
                      <td className="font-bold">
                        {statusFilter === 'Diterima' ? 'Pemberitahuan Kelulusan' : 
                         statusFilter === 'Ditolak' ? 'Pemberitahuan Hasil Seleksi' : 
                         'Pemberitahuan Status Pendaftaran'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="text-right">
                <p>Garut, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="mb-6 text-[12pt] leading-relaxed">
              <p>Kepada Yth.</p>
              <p>Bapak/Ibu Orang Tua/Wali dari calon peserta didik:</p>
              <p className="font-bold text-lg uppercase my-1">{siswa.student_name}</p>
              <p>di Tempat</p>
            </div>

            <div className="mb-6 text-justify leading-relaxed text-[12pt]">
              <p className="mb-3">Assalamu'alaikum Warahmatullahi Wabarakatuh,</p>
              
              <p className="mb-4">
                Berdasarkan hasil seleksi Penerimaan Peserta Didik Baru (PPDB) <b><i>{siswa.unit} Nuurul Muttaqiin</i></b> Tahun Ajaran {new Date().getFullYear()}/{new Date().getFullYear() + 1}, dengan ini kami memberitahukan bahwa calon peserta didik dengan data di bawah ini:
              </p>

              <div className="pl-6 mb-5">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-48 py-1 align-top">Nama Lengkap</td>
                      <td className="w-4 py-1 align-top">:</td>
                      <td className="py-1 font-bold uppercase">{siswa.student_name}</td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">Nomor Pendaftaran</td>
                      <td className="py-1 align-top">:</td>
                      <td className="py-1">{siswa.registration_number}</td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">NISN</td>
                      <td className="py-1 align-top">:</td>
                      <td className="py-1">{siswa.nisn || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">Unit / Sekolah Tujuan</td>
                      <td className="py-1 align-top">:</td>
                      <td className="py-1 font-bold">{siswa.unit} - Kelas {siswa.grade}</td>
                    </tr>
                    {siswa.major && (
                      <tr>
                        <td className="py-1 align-top">Jurusan</td>
                        <td className="py-1 align-top">:</td>
                        <td className="py-1">{siswa.major}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mb-5 text-center">
                {statusFilter === 'Proses' ? 'Status Pendaftaran: ' : 'Dinyatakan '}
                <span className="font-bold border-[1.5px] border-black tracking-widest px-4 py-1 mx-2 uppercase inline-block">
                  {statusFilter === 'Diterima' ? 'Lulus / Diterima' : 
                   statusFilter === 'Ditolak' ? 'Tidak Lulus / Ditolak' : 
                   'Pending / Proses Seleksi'}
                </span> 
              </div>
              
              <p className="mb-4">
                {statusFilter === 'Diterima' 
                  ? "sebagai peserta didik baru di lingkungan Yayasan Nuurul Muttaqiin. Kami mengucapkan selamat atas kelulusan putra/putri Bapak/Ibu."
                  : statusFilter === 'Ditolak'
                  ? "Mohon maaf, berdasarkan hasil seleksi dan kuota yang tersedia, putra/putri Bapak/Ibu belum dapat diterima sebagai peserta didik baru di lingkungan Yayasan Nuurul Muttaqiin pada tahun ajaran ini. Tetap semangat dan semoga sukses di tempat pendidikan lainnya."
                  : "Status pendaftaran putra/putri Bapak/Ibu saat ini sedang dalam proses verifikasi dan seleksi oleh panitia. Mohon bersabar menunggu informasi kelulusan selanjutnya yang akan kami sampaikan."}
              </p>

              {statusFilter === 'Diterima' ? (
                <p className="mb-4">
                  Silakan segera melakukan proses daftar ulang sesuai dengan jadwal dan persyaratan yang telah ditentukan oleh panitia. Kegagalan dalam melakukan daftar ulang sesuai batas waktu yang ditetapkan akan dianggap mengundurkan diri.
                </p>
              ) : (
                <p className="mb-4">
                  Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
                </p>
              )}
              
              {statusFilter === 'Diterima' && (
                <p className="mb-4">
                  Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
                </p>
              )}
              
              <p className="mt-6">Wassalamu'alaikum Warahmatullahi Wabarakatuh.</p>
            </div>

            {/* Tanda Tangan */}
            <div className="mt-12 flex justify-end break-inside-avoid">
              <div className="text-center w-72">
                <p className="mb-20">Mengetahui,<br/>Kepala Sekolah {siswa.unit}</p>
                <p className="font-bold underline decoration-solid underline-offset-4 mb-1">....................................................................</p>
                <p className="text-[11pt]">NIP. ........................................</p>
              </div>
            </div>

          </div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4 portrait;
          margin: 0 !important; /* Hilangkan margin browser, gunakan padding div */
        }
        @media print {
          body, html { 
            background-color: white !important; 
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-container {
             gap: 0 !important;
          }
          .print-page { 
            box-shadow: none !important; 
            margin: 0 !important;
            /* Pastikan width & height persis A4 saat diprint */
            width: 210mm !important;
            min-height: 297mm !important;
            page-break-after: always !important; 
            page-break-inside: avoid !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
