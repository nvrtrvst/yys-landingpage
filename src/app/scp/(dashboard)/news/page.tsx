import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PageHeader } from "@/components/scp/PageHeader";
import { NewsClient } from "./NewsClient";

export default async function AdminNewsPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Manajemen Berita & Artikel" description="Kelola berita, artikel, dan pengumuman untuk website utama." />
      <NewsClient userRole={session?.user.role} userUnitId={session?.user.unit_id ?? null} />
    </div>
  );
}
