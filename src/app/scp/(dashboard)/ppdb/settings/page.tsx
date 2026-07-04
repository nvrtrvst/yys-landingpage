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
    <div className="max-w-5xl mx-auto pb-12">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Pengaturan PPDB & Kartu Peserta</h2>
      <p className="text-gray-500 mb-8">
        Atur jadwal kegiatan PPDB, nama panitia, dan tahun pelajaran untuk dicetak pada Kartu Peserta pendaftar.
      </p>
      <PPDBSettingsForm initialConfig={initialConfig} />
    </div>
  );
}
