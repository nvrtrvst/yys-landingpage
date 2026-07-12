import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const [dbSettings] = await pool.execute<RowDataPacket[]>(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'mading_%'"
    );
    const settings: Record<string, string> = { mading_maintenance_mode: "0", mading_allow_comments: "1", mading_allow_reactions: "1", mading_posts_per_page: "12", mading_require_review: "1" };
    for (const row of dbSettings as RowDataPacket[]) {
      settings[row.setting_key as string] = row.setting_value as string;
    }

    let units: RowDataPacket[] = [];
    if (session.user.role === "admin_unit") {
      const [rows] = await pool.execute<RowDataPacket[]>("SELECT id, name, slug, mading_enabled FROM units WHERE id = ?", [session.user.unit_id]);
      units = rows;
    } else {
      const [rows] = await pool.execute<RowDataPacket[]>("SELECT id, name, slug, mading_enabled FROM units WHERE status = 'active' ORDER BY order_index");
      units = rows;
    }

    return NextResponse.json({ settings, units });
  } catch (error) {
    console.error("Error fetching mading settings:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const body = await request.json();
    const { global, unitUpdates } = body;

    if (global && ["superadmin", "admin"].includes(session.user.role)) {
      for (const [key, value] of Object.entries(global)) {
        if (!key.startsWith("mading_")) continue;
        await pool.execute<ResultSetHeader>(
          "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
          [key, String(value), String(value)]
        );
      }
    }

    if (unitUpdates && typeof unitUpdates === "object") {
      for (const [unitId, enabled] of Object.entries(unitUpdates)) {
          if (session.user.role === "admin_unit") {
          if (String(unitId) !== String(session.user.unit_id)) continue;
        }
        await pool.execute<ResultSetHeader>("UPDATE units SET mading_enabled = ? WHERE id = ?", [enabled ? 1 : 0, unitId]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating mading settings:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
