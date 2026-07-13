import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { getServerSessionDual, madingAuthOptions } from "@/lib/mading-auth";
import { canAccessUnit, createAuditLog, createNotification, getClientIp } from "@/lib/mading";
import { revalidatePath } from "next/cache";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSessionDual();
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM mading_posts WHERE id = ?", [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    const post = rows[0] as RowDataPacket;

    const { action, note } = await request.json();
    const validActions = ["submit", "approved", "rejected", "revision"];
    if (!validActions.includes(action)) return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });

    const isMod = ["superadmin", "admin", "admin_unit", "guru"].includes(session.user.role);
    const isOwner = parseInt(session.user.id) === post.author_id;

    const toStatus = action === "submit" ? "pending" : action;

    if (action === "submit") {
      if (!isOwner) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
      if (!["draft", "revision"].includes(post.status))
        return NextResponse.json({ error: "Hanya draft/revisi yang bisa disubmit" }, { status: 400 });
    } else {
      if (!isMod) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
      if (!canAccessUnit(session.user.role, session.user.unit_id, post.unit_id))
        return NextResponse.json({ error: "Dilarang" }, { status: 403 });
      if ((action === "rejected" || action === "revision") && !note)
        return NextResponse.json({ error: "Alasan wajib diisi" }, { status: 400 });
    }

    const publishedAt = toStatus === "approved" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        "UPDATE mading_posts SET status = ?, revision_note = ?, published_at = ? WHERE id = ?",
        [toStatus, note || null, publishedAt, post.id]
      );
      await conn.execute<ResultSetHeader>(
        "INSERT INTO mading_post_status_logs (post_id, actor_id, from_status, to_status, note) VALUES (?, ?, ?, ?, ?)",
        [post.id, parseInt(session.user.id), post.status, toStatus, note || null]
      );
      await conn.commit();
    } catch (txError: unknown) {
      await conn.rollback();
      console.error("Failed to update post status:", txError);
      return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
    } finally {
      conn.release();
    }

    const msg: Record<string, string> = {
      approved: `Tulisan "${post.title}" telah disetujui!`,
      rejected: `Tulisan "${post.title}" ditolak. Alasan: ${note || "-"}`,
      revision: `Tulisan "${post.title}" diminta revisi. Catatan: ${note || "-"}`,
      pending: `Tulisan "${post.title}" telah dikirim untuk direview.`,
    };
    if (msg[toStatus]) await createNotification(post.author_id, post.id, toStatus, msg[toStatus]);

    // Broadcast Pengumuman ke seluruh anggota unit terkait (atau semua user jika global).
    if (toStatus === "approved" && post.category_id) {
      try {
        const [catRows] = await pool.execute<RowDataPacket[]>(
          "SELECT slug FROM mading_categories WHERE id = ?", [post.category_id]
        );
        if (catRows.length > 0 && (catRows[0] as { slug: string }).slug === "pengumuman") {
          const [members] = await pool.execute<RowDataPacket[]>(
            post.unit_id ? "SELECT id FROM users WHERE unit_id = ?" : "SELECT id FROM users",
            post.unit_id ? [post.unit_id] : []
          );
          const ids = (members as RowDataPacket[])
            .map((m) => m.id as number)
            .filter((id) => id !== post.author_id);
          if (ids.length > 0) {
            const placeholders = ids.map(() => "(?, ?, 'announcement', ?)").join(", ");
            const params = ids.flatMap((id) => [id, post.id, `Pengumuman baru: ${post.title}`]);
            await pool.execute(
              `INSERT INTO mading_notifications (user_id, post_id, type, message) VALUES ${placeholders}`,
              params
            );
          }
        }
      } catch (broadcastError) {
        console.error("Error broadcasting announcement:", broadcastError);
      }
    }

    await createAuditLog(
      parseInt(session.user.id),
      post.unit_id,
      `post_${toStatus}`,
      "post",
      post.id,
      note || null,
      getClientIp(request)
    );

    revalidatePath("/mading");
    return NextResponse.json({ success: true, status: toStatus });
  } catch (error) {
    console.error("Error updating post status:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
