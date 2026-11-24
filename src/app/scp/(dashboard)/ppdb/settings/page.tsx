import { PageHeader } from "@/components/scp/PageHeader";
import { PPDBSettingsForm } from "./PPDBSettingsForm";
import { getSettings } from "@/lib/db";

export default async function AdminPPDBSettingsPage() {
  const settings = await getSettings();

  let initialConfig = null;
  if (settings.ppdb_config) {
    try {
      initialConfig = JSON.parse(settings.ppdb_config);
    } catch (e) {
      console.error("Failed to parse ppdb_config JSON", e);
    }
  }

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
