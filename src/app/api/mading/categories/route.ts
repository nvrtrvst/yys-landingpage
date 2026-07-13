import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get("unit_id");
    let where = "WHERE (c.unit_id IS NULL";
    const params: (string | number)[] = [];
    if (unitId) { where += " OR c.unit_id = ?"; params.push(parseInt(unitId)); }
    where += ") AND c.is_active = 1";
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.* FROM mading_categories c ${where} ORDER BY c.order_index ASC, c.name ASC`, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const { name, description, unit_id } = await request.json();
    if (!name || name.trim().length < 2)
      return NextResponse.json({ error: "Nama minimal 2 karakter" }, { status: 400 });

    if (session.user.role === "admin_unit" && unit_id && unit_id !== session.user.unit_id)
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });
    if (!unit_id && session.user.role === "admin_unit")
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").trim();
    const targetUnit = session.user.role === "admin_unit" ? session.user.unit_id : (unit_id || null);

    const [inserted] = await pool.execute<ResultSetHeader>(
      "INSERT INTO mading_categories (name, slug, description, unit_id) VALUES (?, ?, ?, ?)",
      [name.trim(), slug, description || null, targetUnit]);
    return NextResponse.json({ success: true, id: inserted.insertId });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "ER_DUP_ENTRY")
      return NextResponse.json({ error: "Kategori sudah ada" }, { status: 400 });
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
