"use client";

// Info spesifik per unit; tambahkan cabang baru di sini bila perlu.
export function UnitInformation({ unit }: { unit: string }) {
  if (unit === 'SMK') {
    return (
      <div className="mt-4 p-4 md:p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm md:text-base text-gray-800 space-y-4 shadow-sm w-full overflow-hidden">
        <div>
          <h4 className="font-bold text-emerald-900 mb-2 border-b border-emerald-200 pb-1 text-sm md:text-base">PROGRAM UNGGULAN KAMI:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Program Tahsin dan Tahfidz Al-Qur&apos;an.</li>
            <li>TRANS 7 (Tadarus Al-Qur’an setiap jam 7).</li>
            <li>Kelas Bahasa Jepang &amp; Penyaluran Kerja ke Jepang (LPK IMS ORI).</li>
            <li>Penyaluran Lulusan ke Dunia Industri melalui BKK.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-emerald-900 mb-2 border-b border-emerald-200 pb-1 text-sm md:text-base">PERSYARATAN ADMINISTRASI (Diunggah/dibawa saat daftar ulang):</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Fotocopy Akte Kelahiran &amp; Kartu Keluarga.</li>
            <li>Fotocopy KIP (Jika ada).</li>
            <li>Pas Foto 3x4 Berwarna (2 Lembar).</li>
            <li>Fotocopy Ijazah SD</li>
            <li>Fotocopy Ijazah SMP/MTs atau Surat Keterangan Lulus (SKL).</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-emerald-900 mb-2 border-b border-emerald-200 pb-1 text-sm md:text-base">KONTAK PANITIA SPMB:</h4>

          <div className="flex items-start gap-2 mb-3">
            <span className="text-base mt-0.5 flex-shrink-0">📞</span>
            <div className="flex-1 min-w-0">
              <a href="https://wa.me/6289503078501" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-900 hover:underline font-medium inline-block">
                WhatsApp: +62 895-0307-8501
              </a>
              <span className="text-xs italic text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full inline-block mt-1 md:mt-0 md:ml-2">(Klik untuk chat)</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-base mt-0.5 flex-shrink-0">📍</span>
            <div className="flex-1 min-w-0">
              <a href="https://maps.google.com/?q=Jalur+Kereta+Api+Garut+-+Cikajang+No.160,+Cisurupan,+Kec.+Cisurupan,+Kabupaten+Garut,+Jawa+Barat+44163" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-900 hover:underline block leading-relaxed break-words">
                Alamat: Jalur Kereta Api Garut - Cikajang No.160, Cisurupan, Kec. Cisurupan, Kabupaten Garut, Jawa Barat 44163
              </a>
              <div className="mt-1">
                <span className="text-xs italic text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full inline-block">(Klik untuk buka lokasi di Google Maps)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 text-center italic font-semibold text-emerald-800 border-t border-emerald-200 mt-4 text-xs md:text-sm">
          &quot;Membangun Generasi Bermoral, Beramal, Intelektual, Profesional&quot;
        </div>
      </div>
    );
  }

  return null;
}
