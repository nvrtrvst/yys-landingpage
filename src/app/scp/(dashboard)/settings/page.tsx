import { PageHeader } from "@/components/scp/PageHeader";
import { SettingsForm } from "./SettingsForm";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export default async function AdminSettingsPage() {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT setting_key, setting_value FROM settings');
  
  const settingsData: Record<string, string> = {};
  rows.forEach(row => {
    settingsData[row.setting_key] = row.setting_value;
  });

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
