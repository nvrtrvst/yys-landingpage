import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Halaman Tidak Ditemukan",
  description: "Halaman yang Anda cari tidak ditemukan di website Yayasan Nuurul Muttaqiin.",
};

export default function NotFound() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-black text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-8">Halaman yang Anda cari mungkin telah dipindah atau dihapus.</p>
        <Link href="/" className="inline-block px-8 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition">
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
