import { PageHeader } from "@/components/scp/PageHeader";
import { SettingsForm } from "./SettingsForm";
import { getSettings } from "@/lib/db";

export default async function AdminSettingsPage() {
  const settingsData = await getSettings();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Pengaturan Global"
        description="Atur informasi utama, kontak, hero section, dan tampilan website. Perubahan langsung tampil di halaman depan."
      />
      <SettingsForm initialData={settingsData} />
    </div>
  );
}