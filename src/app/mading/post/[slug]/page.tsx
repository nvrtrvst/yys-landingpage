import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { notFound, redirect } from "next/navigation";

export default async function PostBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.id, un.slug as unit_slug
     FROM mading_posts p LEFT JOIN units un ON p.unit_id = un.id
     WHERE p.slug = ? AND p.status = 'approved'`, [slug]);
  if (rows.length === 0) notFound();
  const post = rows[0] as RowDataPacket;
  if (!post.unit_slug) notFound();
  redirect(`/mading/${post.unit_slug}/${slug}`);
}
