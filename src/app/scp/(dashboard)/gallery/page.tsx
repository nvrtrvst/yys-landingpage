import { PageHeader } from "@/components/scp/PageHeader";
import { GalleryClient } from "./GalleryClient";

export default function AdminGalleryPage() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Manajemen Galeri" description="Kelola foto-foto kegiatan dan dokumentasi yayasan." />
      <GalleryClient />
    </div>
  );
}
