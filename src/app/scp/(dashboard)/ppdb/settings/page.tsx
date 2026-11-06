import { PageHeader } from "@/components/scp/PageHeader";
import { PPDBSettingsForm } from "./PPDBSettingsForm";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export default async function AdminPPDBSettingsPage() {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT setting_value FROM settings WHERE setting_key = "ppdb_config"');
  
  let initialConfig = null;
  if (rows.length > 0 && rows[0].setting_value) {
    try {
      initialConfig = JSON.parse(rows[0].setting_value);
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
