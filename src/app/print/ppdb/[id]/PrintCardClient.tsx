"use client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface PrintStudent {
  id: number;
  email?: string;
  unit: string;
  registration_number: string;
  student_name: string;
  birth_place?: string;
  birth_date?: string;
  address?: string;
  phone?: string;
  previous_school?: string;
  student_photo?: string;
  room?: string;
}

interface PrintSchedule {
  activity: string;
  wave1: string;
  wave2: string;
}

interface PrintPpdbConfig {
  academic_year?: string;
  headmaster_name?: string;
  committee_name?: string;
  schedules: PrintSchedule[];
}

export default function PrintCardClient({ student, ppdbConfig }: { student: PrintStudent, ppdbConfig: PrintPpdbConfig }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const handleSendEmail = async () => {
    if (!student.email) {
      return toast.error("Calon siswa ini tidak memiliki alamat email yang tersimpan.");
    }
    if (!cardRef.current) return;

    const toastId = toast.loading("Membuat softfile PDF...");
    setIsSending(true);

    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.7);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [280, 190]
      });
      pdf.addImage(imgData, "JPEG", 0, 0, 280, 190);
      const pdfBase64 = pdf.output("datauristring");

      toast.loading("Mengirim email...", { id: toastId });

      const res = await fetch(`/api/admin/ppdb/${student.id}/send-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim email");

      toast.success(`Berhasil mengirim softfile ke ${student.email}`, { id: toastId });
    } catch(err: unknown) {
      console.error(err);
      toast.error((err instanceof Error ? err.message : String(err)) || "Gagal membuat atau mengirim PDF", { id: toastId });
    } finally {
      setIsSending(false);
    }
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
        <div className="flex gap-2">
          <button 
            onClick={handleSendEmail}
            disabled={isSending}
            className={`px-4 py-2 rounded font-bold transition flex gap-2 items-center ${isSending ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            {isSending ? "Mengirim..." : "✉️ Kirim Email (PDF)"}
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition"
          >
            🖨️ Cetak Sekarang
          </button>
        </div>
      </div>

      {/* The Printable Card Container */}
      <div ref={cardRef} className="print-container mx-auto w-[280mm] h-[190mm] box-border p-4 bg-white font-sans text-black flex gap-4">
        
        {/* LEFT SIDE: SCHEDULE */}
        <div className="w-1/2 border-[3px] border-black p-4 flex flex-col justify-between">
          <div className="text-center font-bold mb-4">
            <h2 className="text-sm">JADWAL KEGIATAN SPMB</h2>
            <h1 className="text-base uppercase">{student.unit} NUURUL MUTTAQIIN CISURUPAN</h1>
            <h2 className="text-sm">TAHUN PELAJARAN {ppdbConfig.academic_year}</h2>
          </div>

          <table className="w-full text-[11px] border-collapse border border-black mb-4 flex-grow">
            <thead>
              <tr className="text-center font-bold" style={{ backgroundColor: '#f3f4f6' }}>
                <th className="border border-black p-1 w-[40%]">URAIAN KEGIATAN</th>
                <th className="border border-black p-1 w-[30%]">GELOMBANG 1<br/>HARI/TANGGAL</th>
                <th className="border border-black p-1 w-[30%]">GELOMBANG 2<br/>HARI/TANGGAL</th>
              </tr>
            </thead>
            <tbody>
              {ppdbConfig.schedules.map((s: PrintSchedule, idx: number) => (
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
              <p className="font-bold underline uppercase">{ppdbConfig.headmaster_name || '........................'}</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: BIODATA */}
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
                    <td className="py-1 uppercase">{student.previous_school || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Photo Box */}
            <div className="w-24 shrink-0 flex flex-col gap-2">
              <div className="w-24 h-32 border border-black flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#f9fafb' }}>
                {student.student_photo ? (
                  <img src={student.student_photo} alt="Foto" className="w-full h-full object-cover" crossOrigin="anonymous" />
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
            <div className="w-32 h-10 border flex items-center justify-center relative" style={{ borderColor: '#9ca3af' }}>
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
