"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_name: string;
  user_role: string;
  user_nis: string | null;
  is_flagged: number;
  parent_id: number | null;
  replies?: Comment[];
}

function buildTree(flat: Comment[]): Comment[] {
  const map = new Map<number, Comment>();
  const roots: Comment[] = [];
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function roleLabel(role: string) {
  if (role === "siswa") return "Siswa";
  if (role === "guru") return "Guru";
  return "";
}

export function Comments({ postId }: { postId: number }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const tree = useMemo(() => buildTree(comments), [comments]);
  const total = comments.length;
  const isMod = ["superadmin", "admin", "admin_unit"].includes(session?.user?.role || "");

  const load = () =>
    fetch(`/api/mading/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setFetching(false));

  useEffect(() => {
    load();
  }, [postId]);

  const submitComment = async (text: string, parentId: number | null) => {
    if (!session) { toast.error("Login untuk berkomentar"); return; }
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/mading/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), parent_id: parentId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal"); return; }
      if (parentId === null) setContent("");
      else { setReplyContent(""); setReplyingTo(null); }
      await load();
      toast.success("Komentar terkirim!");
    } catch { toast.error("Kesalahan server"); }
    finally { setLoading(false); }
  };

  const renderComment = (c: Comment, depth = 0) => (
    <div key={c.id} className={depth > 0 ? "ml-5 sm:ml-8 mt-3 border-l-2 border-gray-100 pl-4" : ""}>
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-gray-900">{c.user_name}</span>
          <span className="text-xs text-gray-400">{roleLabel(c.user_role)}</span>
          {isMod && c.user_nis && <span className="text-xs text-gray-400 font-mono">NIS {c.user_nis}</span>}
          {isMod && c.is_flagged ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-700/10">
              ⚠ Perlu moderasi
            </span>
          ) : null}
          <span className="text-xs text-gray-400">
            {new Date(c.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">{c.content}</p>
        {session && (
          <button
            type="button"
            onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
            className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Balas
          </button>
        )}
        {replyingTo === c.id && (
          <form
            onSubmit={(e) => { e.preventDefault(); submitComment(replyContent, c.id); }}
            className="mt-2 flex gap-2"
          >
            <input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Balas ${c.user_name}...`}
              maxLength={1000}
              autoFocus
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              disabled={loading || !replyContent.trim()}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Kirim
            </button>
          </form>
        )}
      </div>
      {c.replies && c.replies.length > 0 && (
        <div className="space-y-0">
          {c.replies.map((r) => renderComment(r, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-8 pt-6 border-t">
      <h3 className="font-semibold text-gray-900 mb-4">Komentar ({total})</h3>

      {session ? (
        <form onSubmit={(e) => { e.preventDefault(); submitComment(content, null); }} className="mb-6 flex gap-2">
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tulis komentar..." maxLength={1000}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button type="submit" disabled={loading || !content.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">Kirim</button>
        </form>
      ) : (
        <p className="text-sm text-gray-400 mb-6"><Link href="/mading/siswa/login" className="text-green-600 hover:underline">Login</Link> untuk berkomentar</p>
      )}

      {fetching ? (
        <p className="text-sm text-gray-400">Memuat komentar...</p>
      ) : total === 0 ? (
        <p className="text-sm text-gray-400">Belum ada komentar.</p>
      ) : (
        <div className="space-y-3 max-h-[32rem] overflow-y-auto">
          {tree.map((c) => renderComment(c))}
        </div>
      )}
    </div>
  );
}
