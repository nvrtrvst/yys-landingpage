import { PageHeader } from "@/components/scp/PageHeader";
import { NewsClient } from "./NewsClient";

export default function AdminNewsPage() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Manajemen Berita & Artikel" description="Kelola berita, artikel, dan pengumuman untuk website utama." />
      <NewsClient />
    </div>
  );
}
