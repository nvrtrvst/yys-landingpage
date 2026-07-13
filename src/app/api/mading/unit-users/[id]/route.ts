import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { createAuditLog, getClientIp } from "@/lib/mading";

function checkAuth(session: any) {
  if (!session) return "Tidak terautentikasi";
  if (!["superadmin", "admin", "admin_unit"].includes(session.user.role)) return "Dilarang";
  return null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const err = checkAuth(session);
    if (err) return NextResponse.json({ error: err }, { status: err === "Tidak terautentikasi" ? 401 : 403 });

    const { name, role, password, nis, class_name } = await request.json();
    const userId = (await params).id;

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT id, name, email, role, unit_id, nis FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    const user = rows[0] as RowDataPacket;

    // admin_unit only allowed to edit guru/siswa in their unit
    if (session!.user.role === "admin_unit") {
      if (user.unit_id !== session!.user.unit_id) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
      if (!["guru", "siswa"].includes(user.role)) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
      if (role && !["guru", "siswa"].includes(role)) return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }

    const newRole = role || user.role;
    if (newRole === "siswa" && !nis) {
      return NextResponse.json({ error: "Siswa wajib memiliki NIS" }, { status: 400 });
    }
    if (nis) {
      const [dupNis] = await pool.execute<RowDataPacket[]>("SELECT id FROM users WHERE nis = ? AND id <> ?", [nis, userId]);
      if (dupNis.length > 0) return NextResponse.json({ error: "NIS sudah terdaftar" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (name && name.trim().length >= 2) { updates.push("name = ?"); values.push(name.trim()); }
    if (role && session!.user.role !== "admin_unit") { updates.push("role = ?"); values.push(role); }
    if (typeof nis === "string") { updates.push("nis = ?"); values.push(nis.trim() || null); updates.push("identity_verified = ?"); values.push(nis.trim() ? 1 : 0); }
    if (typeof class_name === "string") { updates.push("class_name = ?"); values.push(class_name.trim() || null); }
    if (password) {
      if (password.length < 6) return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      updates.push("password = ?");
      values.push(await bcrypt.hash(password, 10));
    }

    if (updates.length === 0) return NextResponse.json({ error: "Tidak ada yang diubah" }, { status: 400 });

    values.push(userId);
    await pool.execute<ResultSetHeader>(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    await createAuditLog(parseInt(session!.user.id), user.unit_id, "user_update", "user", user.id, `Mengupdate user ${user.name} (${user.email})`, getClientIp(request));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const err = checkAuth(session);
    if (err) return NextResponse.json({ error: err }, { status: err === "Tidak terautentikasi" ? 401 : 403 });

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT id, name, email, role, unit_id FROM users WHERE id = ?", [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    const user = rows[0] as RowDataPacket;

    if (session!.user.role === "admin_unit") {
      if (user.unit_id !== session!.user.unit_id) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
      if (!["guru", "siswa"].includes(user.role)) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
    }

    await pool.execute("DELETE FROM users WHERE id = ?", [user.id]);
    await createAuditLog(parseInt(session!.user.id), user.unit_id, "user_delete", "user", user.id, `Menghapus user ${user.name} (${user.email})`, getClientIp(request));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
