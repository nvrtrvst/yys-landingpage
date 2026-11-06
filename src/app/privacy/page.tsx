import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi penggunaan situs dan data PPDB Yayasan Nuurul Muttaqiin.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="bg-primary-900 pt-32 pb-16 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="font-serif text-4xl font-bold md:text-5xl">Kebijakan Privasi</h1>
          <p className="mt-3 max-w-2xl text-primary-100">
            Penjelasan data yang kami kumpulkan, cara penggunaannya, dan hak Anda sebagai pengguna situs.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto max-w-3xl space-y-8 px-4 text-gray-700 md:px-6">
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900">Data yang Kami Kumpulkan</h2>
            <p>
              Melalui formulir PPDB, kami mengumpulkan data calon peserta didik dan orang tua/wali, meliputi nama,
              tempat dan tanggal lahir, jenis kelamin, alamat, nomor telepon, email, asal sekolah, serta dokumen
              pendukung yang Anda unggah.
            </p>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900">Penggunaan Data</h2>
            <p>
              Data digunakan untuk memproses pendaftaran, verifikasi berkas, komunikasi panitia, pengumuman hasil
              seleksi, dan administrasi peserta didik yang diterima. Data yang diperlukan dapat diteruskan ke sistem
              administrasi keuangan sekolah untuk pembuatan data siswa.
            </p>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900">Penyimpanan dan Keamanan</h2>
            <p>
              Data disimpan pada sistem yang aksesnya dibatasi untuk panitia dan administrator yang berwenang. Kami
              berupaya menjaga kerahasiaan data, namun tidak dapat menjamin keamanan mutlak atas transmisi melalui
              internet.
            </p>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900">Hak Anda</h2>
            <p>
              Anda dapat meminta pembaruan atau penghapusan data dengan menghubungi panitia. Permintaan akan
              ditindaklanjuti sepanjang tidak bertentangan dengan kewajiban administrasi sekolah.
            </p>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900">Kontak</h2>
            <p>
              Pertanyaan mengenai privasi dapat disampaikan melalui email info@nuurulmuttaqiin.or.id atau telepon
              0262-577358.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
