import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rl = checkRateLimit(`reset:${getClientIp(request)}`, 5, 60 * 1000);
    if (!rl.allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });

    const { token, password } = await request.json();
    if (!token || !password) return NextResponse.json({ error: "Token dan password diperlukan" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });

    const [tokens] = await pool.execute<RowDataPacket[]>(
      "SELECT id, email FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()",
      [token]
    );

    if (tokens.length === 0) return NextResponse.json({ error: "Token tidak valid atau sudah kadaluarsa" }, { status: 400 });

    const row = tokens[0] as RowDataPacket;
    const hashed = await bcrypt.hash(password, 10);

    await pool.execute<ResultSetHeader>("UPDATE users SET password = ? WHERE email = ?", [hashed, row.email]);
    await pool.execute<ResultSetHeader>("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", [row.id]);

    return NextResponse.json({ success: true, message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Error reset password:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
