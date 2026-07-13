import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";
import { createNotification } from "@/lib/mading";
import { containsProfanity } from "@/lib/profanity";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Komentar tidak boleh kosong").max(1000, "Komentar maksimal 1000 karakter"),
  parent_id: z.number().int().nullable().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const postId = (await params).id;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id, c.content, c.created_at, c.parent_id, c.is_flagged,
              u.name as user_name, u.role as user_role, u.nis as user_nis
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

    const isFlagged = containsProfanity(valid.data.content);
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO mading_comments (post_id, user_id, content, parent_id, is_flagged, flag_reason) VALUES (?, ?, ?, ?, ?, ?)",
      [postId, parseInt(session.user.id), valid.data.content, parentId, isFlagged ? 1 : 0, isFlagged ? "profanity" : null]
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

    if (isFlagged) {
      try {
        const [postRows2] = await pool.execute<RowDataPacket[]>(
          "SELECT unit_id, title FROM mading_posts WHERE id = ?", [postId]
        );
        if (postRows2.length > 0) {
          const { unit_id, title } = postRows2[0] as { unit_id: number | null; title: string };
          const [admins] = await pool.execute<RowDataPacket[]>(
            "SELECT id FROM users WHERE role IN ('superadmin', 'admin_unit') AND (unit_id = ? OR role = 'superadmin')",
            [unit_id ?? -1]
          );
          for (const a of admins) {
            await createNotification(
              (a as { id: number }).id,
              parseInt(postId),
              "comment_flagged",
              `Komentar yang perlu moderasi pada "${title}"`
            );
          }
        }
      } catch (flagErr) {
        console.error("Error notifying flagged comment:", flagErr);
      }
    }

    return NextResponse.json({ success: true, id: result.insertId, flagged: isFlagged });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
