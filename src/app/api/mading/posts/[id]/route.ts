import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { getServerSessionDual, madingAuthOptions } from "@/lib/mading-auth";
import { canAccessUnit, createAuditLog } from "@/lib/mading";
import { getClientIp } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, u.name as author_name, c.name as category_name, c.slug as category_slug, un.name as unit_name, un.slug as unit_slug
       FROM mading_posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN mading_categories c ON p.category_id = c.id
       LEFT JOIN units un ON p.unit_id = un.id
       WHERE p.id = ?`,
      [(await params).id]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const post = rows[0] as RowDataPacket;
    if (post.status !== "approved") {
      const session = await getServerSessionDual();
      if (!session) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
      const isOwner = parseInt(session.user.id) === post.author_id;
      const isMod = ["superadmin", "admin", "admin_unit", "guru"].includes(session.user.role);
      if (!isOwner && !isMod) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
      if (isMod && !canAccessUnit(session.user.role, session.user.unit_id, post.unit_id))
        return NextResponse.json({ error: "Dilarang" }, { status: 403 });
    }
    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSessionDual();
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM mading_posts WHERE id = ?", [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    const post = rows[0] as RowDataPacket;

    const isOwner = parseInt(session.user.id) === post.author_id;
    const isMod = ["superadmin", "admin", "admin_unit", "guru"].includes(session.user.role);
    const canEdit = isOwner && ["draft", "revision"].includes(post.status);
    const canModEdit = isMod && canAccessUnit(session.user.role, session.user.unit_id, post.unit_id) && session.user.role === "superadmin";
    if (!canEdit && !canModEdit) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

    const body = await request.json();
    await pool.execute(
      "UPDATE mading_posts SET title = ?, content = ?, cover_image = ?, category_id = ? WHERE id = ?",
      [body.title || post.title, body.content || post.content, body.cover_image !== undefined ? body.cover_image : post.cover_image, body.category_id !== undefined ? body.category_id : post.category_id, post.id]
    );
    revalidatePath("/mading");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSessionDual();
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM mading_posts WHERE id = ?", [(await params).id]);
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    const post = rows[0] as RowDataPacket;

    const isOwner = parseInt(session.user.id) === post.author_id;
    const isMod = ["superadmin", "admin", "admin_unit", "guru"].includes(session.user.role);
    const canDeleteOwn = isOwner && ["draft", "revision"].includes(post.status);
    const canModDelete = isMod && canAccessUnit(session.user.role, session.user.unit_id, post.unit_id);
    if (!canDeleteOwn && !canModDelete) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

    await pool.execute("DELETE FROM mading_posts WHERE id = ?", [post.id]);
    await createAuditLog(parseInt(session.user.id), post.unit_id, "delete", "post", post.id, `Menghapus post: ${post.title}`, getClientIp(request));
    revalidatePath("/mading");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
