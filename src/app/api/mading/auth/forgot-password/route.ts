import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rl = checkRateLimit(`forgot:${getClientIp(request)}`, 5, 60 * 1000);
    if (!rl.allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });

    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email diperlukan" }, { status: 400 });

    const [users] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name, email FROM users WHERE email = ? AND role IN ('siswa', 'guru')",
      [email]
    );

    if (users.length === 0) {
      // Uniform response — prevent user enumeration
      return NextResponse.json({ success: true, message: "Jika email terdaftar, tautan reset password akan dikirim." });
    }

    const user = users[0] as RowDataPacket;
    const token = crypto.randomBytes(32).toString("hex");

    await pool.execute<ResultSetHeader>(
      "INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
      [email, token]
    );

    await sendPasswordResetEmail({ to: email, name: user.name as string, token });

    return NextResponse.json({ success: true, message: "Email reset password terkirim" });
  } catch (error) {
    console.error("Error forgot password:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
