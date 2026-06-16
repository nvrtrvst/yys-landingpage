import { GalleryClient } from "./GalleryClient";

export default function AdminGalleryPage() {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">Manajemen Galeri</h2>
      <p className="text-gray-500 mb-6">Kelola foto-foto kegiatan dan dokumentasi yayasan.</p>
      <GalleryClient />
    </div>
  );
}
