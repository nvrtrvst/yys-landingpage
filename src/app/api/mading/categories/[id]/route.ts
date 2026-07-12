import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM mading_categories WHERE id = ?", [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    const cat = rows[0] as RowDataPacket;
    if (session.user.role === "admin_unit" && (cat.unit_id !== session.user.unit_id || cat.unit_id === null))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const body = await request.json();
    await pool.execute("UPDATE mading_categories SET name=?, description=?, is_active=?, order_index=? WHERE id=?",
      [body.name || cat.name, body.description !== undefined ? body.description : cat.description,
       body.is_active !== undefined ? body.is_active : cat.is_active,
       body.order_index !== undefined ? body.order_index : cat.order_index, cat.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM mading_categories WHERE id = ?", [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    const cat = rows[0] as RowDataPacket;
    if (session.user.role === "admin_unit" && cat.unit_id !== session.user.unit_id)
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    await pool.execute("DELETE FROM mading_categories WHERE id = ?", [cat.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
