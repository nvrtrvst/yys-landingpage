import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";
import { createNotification } from "@/lib/mading";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Komentar tidak boleh kosong").max(1000, "Komentar maksimal 1000 karakter"),
  parent_id: z.number().int().nullable().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const postId = (await params).id;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id, c.content, c.created_at, c.parent_id, u.name as user_name, u.role as user_role
       FROM mading_comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? ORDER BY c.created_at ASC LIMIT 200`, [postId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(madingAuthOptions);
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const body = await request.json();
    const valid = commentSchema.safeParse(body);
    if (!valid.success) return NextResponse.json({ error: "Komentar tidak valid" }, { status: 400 });

    const postId = (await params).id;
    const userId = parseInt(session.user.id);
    const parentId = valid.data.parent_id ?? null;

    if (parentId) {
      const [parent] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM mading_comments WHERE id = ? AND post_id = ?",
        [parentId, postId]
      );
      if (parent.length === 0) return NextResponse.json({ error: "Komentar induk tidak valid" }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO mading_comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)",
      [postId, parseInt(session.user.id), valid.data.content, parentId]
    );

    try {
      const [postRows] = await pool.execute<RowDataPacket[]>(
        "SELECT id, author_id, title FROM mading_posts WHERE id = ?", [postId]
      );
      if (postRows.length > 0) {
        const post = postRows[0] as { id: number; author_id: number; title: string };
        if (post.author_id !== userId)
          await createNotification(post.author_id, parseInt(postId), "comment", `Komentar baru pada tulisan "${post.title}"`);
        if (parentId) {
          const [parentRows] = await pool.execute<RowDataPacket[]>(
            "SELECT user_id FROM mading_comments WHERE id = ?", [parentId]
          );
          if (parentRows.length > 0) {
            const parentUid = (parentRows[0] as { user_id: number }).user_id;
            if (parentUid !== userId && parentUid !== post.author_id)
              await createNotification(parentUid, parseInt(postId), "comment_reply", `Ada balasan pada diskusi tulisan "${post.title}"`);
          }
        }
      }
    } catch (notifError) {
      console.error("Error creating comment notification:", notifError);
    }

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
