"use client";
import Link from "next/link";
import { Eye, AlertCircle } from "lucide-react";

interface PostCardProps {
  post: {
    id: number; slug?: string; title: string; excerpt?: string;
    cover_image?: string | null; author_name?: string;
    category_name?: string; category_slug?: string;
    published_at?: string; created_at: string; status?: string; views?: number;
  };
  unitSlug?: string;
  showStatus?: boolean;
}

export function PostCard({ post, unitSlug, showStatus }: PostCardProps) {
  const slug = post.slug || String(post.id);
  const link = unitSlug ? `/mading/${unitSlug}/${slug}` : `/mading/post/${slug}`;
  const date = post.published_at || post.created_at;
  const isAnnouncement = post.category_slug === "pengumuman";
  return (
    <Link href={link} className="group block h-full">
      <article className="flex h-full flex-col p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {isAnnouncement && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              <AlertCircle className="h-3 w-3" />
              PENGUMUMAN
            </span>
          )}
          {post.category_name && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-600">
              {post.category_name}
            </span>
          )}
          {showStatus && post.status && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              post.status === "approved" ? "bg-green-100 text-green-700" :
              post.status === "pending" ? "bg-yellow-100 text-yellow-800" :
              post.status === "rejected" ? "bg-red-100 text-red-700" :
              post.status === "revision" ? "bg-blue-100 text-blue-700" :
              "bg-gray-200"
            }`}>{post.status.toUpperCase()}</span>
          )}
        </div>
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-3 mb-3 flex-1">
            {post.excerpt.replace(/<[^>]+>/g, "")}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-gray-100">
          <span>{post.author_name || "Anonim"}</span>
          <div className="flex items-center gap-3">
            {typeof post.views === "number" && (
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {(post.views ?? 0).toLocaleString("id-ID")}
              </span>
            )}
            <span>{new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
