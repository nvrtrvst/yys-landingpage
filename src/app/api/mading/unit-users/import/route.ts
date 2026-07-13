import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/mading";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    if (!["superadmin", "admin", "admin_unit"].includes(session.user.role))
      return NextResponse.json({ error: "Dilarang" }, { status: 403 });

    const rl = checkRateLimit(`import:${getClientIp(request)}`, 5, 60 * 1000);
    if (!rl.allowed) return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });

    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());

    if (lines.length < 2) return NextResponse.json({ error: "CSV harus memiliki header + minimal 1 data" }, { status: 400 });

    const header = lines[0].toLowerCase().split(",").map(h => h.trim());
    const nameIdx = header.indexOf("name");
    const emailIdx = header.indexOf("email");
    const passwordIdx = header.indexOf("password");
    const roleIdx = header.indexOf("role");
    const nisIdx = header.indexOf("nis");
    const classIdx = header.indexOf("class_name");

    if (nameIdx === -1 || emailIdx === -1 || passwordIdx === -1 || roleIdx === -1)
      return NextResponse.json({ error: "CSV header harus: name,email,password,role (opsional: nis,class_name)" }, { status: 400 });

    const unitId = session.user.role === "admin_unit" ? session.user.unit_id : null;
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        const name = cols[nameIdx];
        const email = cols[emailIdx]?.toLowerCase();
        const password = cols[passwordIdx];
        const role = cols[roleIdx]?.toLowerCase();
        const nis = nisIdx >= 0 ? (cols[nisIdx]?.trim() || "") : "";
        const className = classIdx >= 0 ? (cols[classIdx]?.trim() || "") : "";

        if (!name || !email || !password || !role) {
          failed++; errors.push(`Baris ${i + 1}: data tidak lengkap`); continue;
        }
        if (!["guru", "siswa"].includes(role)) {
          failed++; errors.push(`Baris ${i + 1}: role harus guru/siswa`); continue;
        }
        if (password.length < 6) {
          failed++; errors.push(`Baris ${i + 1}: password minimal 6 karakter`); continue;
        }
        if (role === "siswa" && !nis) {
          failed++; errors.push(`Baris ${i + 1}: siswa wajib memiliki NIS`); continue;
        }

        try {
          const [existing] = await conn.execute<RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [email]);
          if (existing.length > 0) { failed++; errors.push(`Baris ${i + 1}: email ${email} sudah ada`); continue; }
          if (nis) {
            const [dupNis] = await conn.execute<RowDataPacket[]>("SELECT id FROM users WHERE nis = ?", [nis]);
            if (dupNis.length > 0) { failed++; errors.push(`Baris ${i + 1}: NIS ${nis} sudah terdaftar`); continue; }
          }

          const hashed = await bcrypt.hash(password, 10);
          const [result] = await conn.execute<ResultSetHeader>(
            "INSERT INTO users (name, email, password, role, unit_id, nis, class_name, identity_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [name, email, hashed, role, unitId, nis || null, className || null, nis ? 1 : 0]
          );
          created++;

          await createAuditLog(
            Number(session.user.id), unitId, "user_create", "user", result.insertId,
            `Import CSV: ${name} (${email}) role ${role}`, getClientIp(request)
          );
        } catch (err: unknown) {
          failed++;
          const code = err instanceof Error && (err as { code?: string }).code;
          if (code === "ER_DUP_ENTRY") errors.push(`Baris ${i + 1}: email ${email} sudah ada`);
          else errors.push(`Baris ${i + 1}: gagal menyimpan data`);
        }
      }

      await conn.commit();
    } catch (outer: unknown) {
      await conn.rollback();
      console.error("Import transaction failed:", outer);
      return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
    } finally {
      conn.release();
    }

    return NextResponse.json({ success: true, created, failed, errors: errors.slice(0, 20) });
  } catch (error) {
    console.error("Error importing users:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
