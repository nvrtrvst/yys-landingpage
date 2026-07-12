import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";
import { createNotification } from "@/lib/mading";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(madingAuthOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const postId = (await params).id;
    const userId = parseInt(session.user.id);

    const [existing] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM mading_reactions WHERE post_id = ? AND user_id = ?", [postId, userId]
    );

    if (existing.length > 0) {
      await pool.execute("DELETE FROM mading_reactions WHERE id = ?", [existing[0].id]);
      return NextResponse.json({ reacted: false });
    }

    await pool.execute<ResultSetHeader>(
      "INSERT INTO mading_reactions (post_id, user_id) VALUES (?, ?)", [postId, userId]
    );

    try {
      const [postRows] = await pool.execute<RowDataPacket[]>(
        "SELECT id, author_id, title FROM mading_posts WHERE id = ?", [postId]
      );
      if (postRows.length > 0) {
        const post = postRows[0] as { id: number; author_id: number; title: string };
        if (post.author_id !== userId)
          await createNotification(post.author_id, parseInt(postId), "reaction", `Seseorang menyukai tulisan "${post.title}"`);
      }
    } catch (notifError) {
      console.error("Error creating reaction notification:", notifError);
    }

    return NextResponse.json({ reacted: true });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const postId = (await params).id;
    const session = await getServerSession(madingAuthOptions);

    const [countRows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM mading_reactions WHERE post_id = ?", [postId]
    );
    const count = (countRows[0] as any).count;

    let userReacted = false;
    if (session) {
      const [userRows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM mading_reactions WHERE post_id = ? AND user_id = ?", [postId, parseInt(session.user.id)]
      );
      userReacted = userRows.length > 0;
    }

    return NextResponse.json({ count, userReacted });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
