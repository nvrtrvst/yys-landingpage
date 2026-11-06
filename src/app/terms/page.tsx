import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat dan ketentuan penggunaan situs serta layanan PPDB Yayasan Nuurul Muttaqiin.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="bg-primary-900 pt-32 pb-16 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="font-serif text-4xl font-bold md:text-5xl">Syarat &amp; Ketentuan</h1>
          <p className="mt-3 max-w-2xl text-primary-100">
            Ketentuan penggunaan situs dan layanan penerimaan peserta didik baru.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-gray-700 md:px-6">
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900">Penggunaan Situs</h2>
            <p>
              Situs ini disediakan untuk informasi yayasan dan layanan PPDB. Anda setuju menggunakan situs secara
              wajar dan tidak melakukan tindakan yang dapat mengganggu keamanan atau ketersediaan layanan.
            </p>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900">Informasi PPDB</h2>
            <p>
              Informasi jadwal, persyaratan, dan hasil seleksi dapat berubah sesuai kebijakan panitia. Data yang Anda
              isi harus benar dan dapat dipertanggungjawabkan. Pendaftaran dapat dibatalkan atau ditolak apabila data
              terbukti tidak valid.
            </p>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900">Kekayaan Intelektual</h2>
            <p>
              Logo, tulisan, foto, dan materi lain di situs ini milik Yayasan Nuurul Muttaqiin atau pihak yang
              memberikannya. Penggunaan ulang untuk kepentingan komersial memerlukan izin tertulis.
            </p>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900">Batasan Tanggung Jawab</h2>
            <p>
              Kami berupaya menyajikan informasi yang akurat, tetapi tidak bertanggung jawab atas gangguan layanan
              atau ketidaktepatan yang terjadi di luar kendali kami. Keputusan akhir penerimaan peserta didik tetap
              berada pada panitia.
            </p>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900">Perubahan Ketentuan</h2>
            <p>
              Ketentuan ini dapat diperbarui sewaktu-waktu. Versi terbaru akan ditampilkan pada halaman ini. Pertanyaan
              dapat disampaikan melalui info@nuurulmuttaqiin.or.id.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
