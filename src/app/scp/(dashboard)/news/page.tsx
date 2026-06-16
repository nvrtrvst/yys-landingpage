import { NewsClient } from "./NewsClient";

export default function AdminNewsPage() {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">Manajemen Berita & Artikel</h2>
      <p className="text-gray-500 mb-6">Kelola berita, artikel, dan pengumuman untuk website utama.</p>
      <NewsClient />
    </div>
  );
}
