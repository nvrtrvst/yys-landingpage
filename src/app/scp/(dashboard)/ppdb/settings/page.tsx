import { PageHeader } from "@/components/scp/PageHeader";
import { PPDBSettingsForm } from "./PPDBSettingsForm";
import { getSettings } from "@/lib/db";
import { parsePpdbConfig } from "@/lib/ppdb-config";

export default async function AdminPPDBSettingsPage() {
  const settings = await getSettings();
  const initialConfig = parsePpdbConfig(settings.ppdb_config);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Pengaturan PPDB & Kartu Peserta"
        description="Atur jadwal kegiatan PPDB, nama panitia, dan tahun pelajaran untuk kartu peserta."
      />
      <PPDBSettingsForm initialConfig={initialConfig} />
    </div>
  );
}