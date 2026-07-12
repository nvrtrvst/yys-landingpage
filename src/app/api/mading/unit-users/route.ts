import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { z } from "zod";
import { createAuditLog, getClientIp } from "@/lib/mading";

function checkAuth(session: any) {
  if (!session) return "Tidak terautentikasi";
  if (!["superadmin", "admin", "admin_unit"].includes(session.user.role)) return "Dilarang";
  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const err = checkAuth(session);
    if (err) return NextResponse.json({ error: err }, { status: err === "Tidak terautentikasi" ? 401 : 403 });

    let query = "SELECT id, name, email, role, unit_id, created_at FROM users WHERE role IN ('guru', 'siswa')";
    const params: (string | number)[] = [];
    if (session!.user.role === "admin_unit") {
      query += " AND unit_id = ?";
      params.push(session!.user.unit_id as number);
    }
    query += " ORDER BY role, name ASC";

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching unit users:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["guru", "siswa"]),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const err = checkAuth(session);
    if (err) return NextResponse.json({ error: err }, { status: err === "Tidak terautentikasi" ? 401 : 403 });

    const body = await request.json();
    const valid = createSchema.safeParse(body);
    if (!valid.success) return NextResponse.json({ error: valid.error.issues[0].message }, { status: 400 });

    const unitId = session!.user.role === "admin_unit" ? session!.user.unit_id : (body.unit_id || null);

    const [existing] = await pool.execute<RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [valid.data.email]);
    if (existing.length > 0) return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });

    const hashed = await bcrypt.hash(valid.data.password, 10);
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO users (name, email, password, role, unit_id) VALUES (?, ?, ?, ?, ?)",
      [valid.data.name, valid.data.email, hashed, valid.data.role, unitId]
    );

    await createAuditLog(parseInt(session!.user.id), unitId, "user_create", "user", result.insertId, `Membuat user ${valid.data.name} (${valid.data.email}) dengan role ${valid.data.role}`, getClientIp(request));

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
