"use client";

import { AlertCircle, Trash2 } from "lucide-react";
import type { MadingPost } from "./shared";

export function ConfirmDeleteModal({
  post,
  busy,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  post: MadingPost;
  busy: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !busy && onCancel()} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-rose-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900">Hapus tulisan?</h3>
            <p className="text-sm text-gray-500 mt-1">
              &quot;{post.title}&quot; akan dihapus permanen. Tindakan tidak dapat dibatalkan.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
