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
    <div className="max-w-5xl mx-auto pb-12">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Pengaturan Global</h2>
      <p className="text-gray-500 mb-8">
        Atur informasi utama, kontak, hero section, dan tampilan website secara langsung. 
        Perubahan yang disimpan akan langsung tampil di halaman depan.
      </p>
      <SettingsForm initialData={settingsData} />
    </div>
  );
}
