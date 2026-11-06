"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/mading/StatusBadge";
import { Inbox, CheckCircle2, AlertCircle, Tag, Eye, User, Trash2 } from "lucide-react";
import type { MadingPost } from "./shared";

export function PostList({
  posts,
  loading,
  activeLabel,
  deleting,
  onRefresh,
  onReview,
  onDelete,
}: {
  posts: MadingPost[];
  loading: boolean;
  activeLabel: string | undefined;
  deleting: number | null;
  onRefresh: () => void;
  onReview: (post: MadingPost) => void;
  onDelete: (post: MadingPost) => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-bold text-gray-900">{activeLabel}</h3>
          {!loading && posts.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
              {posts.length}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Segarkan
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-5 w-2/3 bg-gray-100 rounded mb-3" />
              <div className="h-4 w-1/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <div className="h-14 w-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700">Tidak ada tulisan</p>
          <p className="text-sm text-gray-400 mt-1">Tidak ada tulisan dengan status ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-primary-200 transition-all"
            >
              <div className="flex flex-col sm:flex-row">
                {post.cover_image && (
                  <div className="sm:w-44 sm:shrink-0 h-40 sm:h-auto bg-gray-100">
                    <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <StatusBadge status={post.status} />
                    {post.category_slug === "pengumuman" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        <AlertCircle className="h-3 w-3" />
                        PENGUMUMAN
                      </span>
                    )}
                    {post.category_name && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Tag className="h-3 w-3" />
                        {post.category_name}
                      </span>
                    )}
                    {post.status === "approved" && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Eye className="h-3 w-3" />
                        {(post.views ?? 0).toLocaleString("id-ID")} dibaca
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-primary-700 transition-colors">
                    {post.title}
                  </h4>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 flex-1">{post.excerpt}…</p>
                  )}
                  <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                    <span className="text-xs text-gray-400">
                      <User className="h-3.5 w-3.5 inline mr-1" />
                      {post.author_name} •{" "}
                      {new Date(post.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <div className="flex items-center gap-2">
                      {post.status === "pending" && (
                        <button
                          onClick={() => onReview(post)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </button>
                      )}
                      {post.status === "approved" && post.unit_slug && (
                        <Link
                          href={`/mading/${post.unit_slug}/${post.slug ?? post.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Lihat
                        </Link>
                      )}
                      {post.status === "revision" && (
                        <span className="inline-flex items-center gap-1 text-xs text-sky-600 max-w-[160px] truncate" title={post.revision_note || ""}>
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {post.revision_note || "Menunggu revisi siswa"}
                        </span>
                      )}
                      <button
                        onClick={() => onDelete(post)}
                        disabled={deleting === post.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleting === post.id ? "..." : "Hapus"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
