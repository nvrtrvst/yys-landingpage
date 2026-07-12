import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";
import { uploadFile } from "@/lib/upload";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(madingAuthOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("photo");
    if (!(file instanceof File)) return NextResponse.json({ error: "File tidak valid" }, { status: 400 });

    const result = await uploadFile(
      file,
      "uploads/avatars",
      ["image/jpeg", "image/png", "image/webp"],
      2
    );
    if (!result.success || !result.url) {
      return NextResponse.json({ error: result.error || "Gagal mengunggah foto" }, { status: 400 });
    }

    await pool.execute("UPDATE users SET photo = ? WHERE id = ?", [result.url, session.user.id]);

    return NextResponse.json({ success: true, photo: result.url });
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
