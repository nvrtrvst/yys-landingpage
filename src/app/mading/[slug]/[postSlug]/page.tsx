import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import DOMPurify from "isomorphic-dompurify";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";
import { ReactionButton } from "./ReactionButton";
import { Comments } from "./Comments";
import { PostViewCounter } from "./PostViewCounter";
import { UserAvatar } from "@/components/mading/UserAvatar";

export const revalidate = 60;

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string; postSlug: string }> }) {
  const postSlug = (await params).postSlug;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.*, u.name as author_name, u.photo as author_photo, c.name as category_name, un.name as unit_name, un.slug as unit_slug
     FROM mading_posts p LEFT JOIN users u ON p.author_id = u.id LEFT JOIN mading_categories c ON p.category_id = c.id LEFT JOIN units un ON p.unit_id = un.id
     WHERE p.slug = ? AND p.status = 'approved'`, [postSlug]);
  if (rows.length === 0) notFound();
  const post = rows[0] as RowDataPacket;

  const session = await getServerSession(madingAuthOptions);

  const [countResult, userResult] = await Promise.all([
    pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM mading_reactions WHERE post_id = ?", [post.id]
    ),
    session
      ? pool.execute<RowDataPacket[]>(
          "SELECT id FROM mading_reactions WHERE post_id = ? AND user_id = ?", [post.id, parseInt(session.user.id)]
        )
      : Promise.resolve([[] as RowDataPacket[], []] as [RowDataPacket[], never[]]),
  ]);
  const reactionCount = (countResult[0] as any).count;
  const userReacted = session ? (userResult[0] as RowDataPacket[]).length > 0 : false;

  const dateStr = new Date(post.published_at || post.created_at).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const textLen = (post.content || "").replace(/<[^>]+>/g, "").length;
  const readingTime = Math.max(1, Math.round(textLen / 900));

  return (
    <div className="flex-1 w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <Link href={`/mading/${post.unit_slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Mading {post.unit_name}
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {post.category_name && (
          <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-xs mb-4">
            {post.category_name}
          </span>
        )}
        <h1 className="text-3xl md:text-[2.6rem] md:leading-[1.15] font-bold text-gray-900 mb-6">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-gray-100">
          <UserAvatar name={post.author_name} photo={post.author_photo} size={48} className="rounded-full" />
          <div className="min-w-0">
            <Link
              href={`/mading/penulis/${post.author_id}`}
              className="block font-semibold text-gray-900 hover:text-green-600 transition-colors truncate"
            >
              {post.author_name || "Anonim"}
            </Link>
            <p className="text-sm text-gray-500">{dateStr} &middot; {readingTime} min baca</p>
          </div>
          <div className="ml-auto">
            <PostViewCounter postId={post.id} initialViews={post.views ?? 0} authorId={post.author_id} />
          </div>
        </div>

        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full rounded-2xl mb-8 object-cover max-h-[420px]"
          />
        )}

        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-green-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />
      </article>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="py-6 border-t border-b flex items-center gap-4">
          <ReactionButton postId={post.id} initialCount={reactionCount} initialReacted={userReacted} />
        </div>
        <Comments postId={post.id} />
      </div>
    </div>
  );
}
