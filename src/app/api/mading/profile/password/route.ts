import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";
import bcrypt from "bcrypt";
import { z } from "zod";

const schema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(6, "Password baru minimal 6 karakter"),
});

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(madingAuthOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const body = await request.json();
    const valid = schema.safeParse(body);
    if (!valid.success) return NextResponse.json({ error: valid.error.issues[0].message }, { status: 400 });

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT password FROM users WHERE id = ?", [session.user.id]
    );
    if (rows.length === 0) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    const isMatch = await bcrypt.compare(valid.data.current_password, rows[0].password);
    if (!isMatch) return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });

    const hashed = await bcrypt.hash(valid.data.new_password, 10);
    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [hashed, session.user.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
