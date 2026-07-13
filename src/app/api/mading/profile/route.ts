import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
});

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(madingAuthOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const body = await request.json();
    const valid = schema.safeParse(body);
    if (!valid.success) return NextResponse.json({ error: valid.error.issues[0].message }, { status: 400 });

    if (session.user.role === "siswa") {
      return NextResponse.json({ error: "Nama tidak dapat diubah" }, { status: 403 });
    }

    await pool.execute("UPDATE users SET name = ? WHERE id = ?", [valid.data.name, session.user.id]);

    return NextResponse.json({ success: true, name: valid.data.name });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
