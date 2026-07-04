import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PrintCardClient from "./PrintCardClient";

export default async function PrintPPDBPage({ params }: { params: Promise<{ id: string }> }) {
  // Authentication check (Security: Prevent IDOR)
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/scp/login");
  }

  const { id } = await params;

  // 1. Fetch Student Data
  const [studentRows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM ppdb_submissions WHERE id = ?',
    [id]
  );
  if (studentRows.length === 0) {
    return <div className="p-10 text-center font-bold text-red-500">Data pendaftar tidak ditemukan.</div>;
  }
  const student = studentRows[0];

  // 2. Fetch Global Settings (PPDB Config)
  const [settingRows] = await pool.execute<RowDataPacket[]>(
    'SELECT setting_value FROM settings WHERE setting_key = "ppdb_config"'
  );
  
  let ppdbConfig = {
    academic_year: "2026-2027",
    headmaster_name: "",
    committee_name: "",
    schedules: [] as any[]
  };

  if (settingRows.length > 0 && settingRows[0].setting_value) {
    try {
      const parsed = JSON.parse(settingRows[0].setting_value);
      if (parsed) ppdbConfig = { ...ppdbConfig, ...parsed };
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <PrintCardClient student={student} ppdbConfig={ppdbConfig} />
  );
}
