"use client";

import DOMPurify from "isomorphic-dompurify";
import { StatusBadge } from "@/components/mading/StatusBadge";
import { AlertCircle, Tag, XCircle, CheckCircle2, FileEdit } from "lucide-react";
import type { MadingPost } from "./shared";

export function ReviewModal({
  post,
  note,
  setNote,
  processing,
  loadingPost,
  onClose,
  onApprove,
  onRevision,
  onReject,
}: {
  post: MadingPost;
  note: string;
  setNote: (value: string) => void;
  processing: boolean;
  loadingPost: boolean;
  onClose: () => void;
  onApprove: () => void;
  onRevision: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !processing && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
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
            </div>
            <h3 className="font-bold text-gray-900 text-lg leading-snug pr-4">{post.title}</h3>
            <p className="text-xs text-gray-400 mt-1">
              Oleh <span className="font-medium text-gray-600">{post.author_name}</span> •{" "}
              {new Date(post.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => !processing && onClose()}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            disabled={processing}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
          )}
          {loadingPost ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
            </div>
          ) : (
            <div
              className="text-sm text-gray-700 max-w-none [&_p]:mb-4 [&_p]:leading-7 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:bg-gray-50 [&_blockquote]:py-1 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary-600 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || post.excerpt || "") }}
            />
          )}

          {post.status === "revision" && post.revision_note && (
            <div className="mt-4 flex gap-2 p-3 rounded-xl bg-sky-50 text-sky-800 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Catatan revisi sebelumnya</p>
                <p>{post.revision_note}</p>
              </div>
            </div>
          )}

          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catatan / Alasan
              <span className="text-gray-400 font-normal"> (wajib untuk revisi &amp; tolak)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tulis alasan penolakan atau catatan revisi…"
              rows={3}
              disabled={processing}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow resize-none disabled:bg-gray-50"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-wrap gap-2 justify-end rounded-b-2xl">
          <button
            onClick={onApprove}
            disabled={processing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Setujui
          </button>
          <button
            onClick={onRevision}
            disabled={processing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            <FileEdit className="h-4 w-4" />
            Minta Revisi
          </button>
          <button
            onClick={onReject}
            disabled={processing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Tolak
          </button>
        </div>
      </div>
    </div>
  );
}
