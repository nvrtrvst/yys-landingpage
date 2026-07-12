import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(madingAuthOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    await pool.execute(
      "UPDATE mading_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
      [parseInt(session.user.id)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
