import { HeaderUI, type UnitItem } from "./HeaderUI";
import pool from "@/lib/db";
import { getSettings } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function Header() {
  const settings = await getSettings();

  let units: UnitItem[] = [];
  try {
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT slug, name FROM units WHERE status = 'active' ORDER BY order_index ASC");
    units = rows as UnitItem[];
  } catch (error) {
    console.error("Failed to fetch units for header", error);
  }

  // Ensure settings is a plain object string:string
  const cleanSettings: Record<string, string> = {};
  for (const key in settings) {
    cleanSettings[key] = String(settings[key]);
  }

  return <HeaderUI settings={cleanSettings} units={units} />;
}
