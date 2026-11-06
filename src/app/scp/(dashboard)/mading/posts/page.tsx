"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import DOMPurify from "isomorphic-dompurify";
import { StatusBadge } from "@/components/mading/StatusBadge";
import { Check, RotateCcw, X } from "lucide-react";
import { PageHeader } from "@/components/scp/PageHeader";

interface MadingPost {
  id: number;
  title: string;
  author_name: string;
  category_name: string | null;
  content: string;
  excerpt: string | null;
  created_at: string;
  status: string;
}

export default function MadingPostsPage() {
  const [posts, setPosts] = useState<MadingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selectedPost, setSelectedPost] = useState<MadingPost | null>(null);
  const [note, setNote] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mading/posts?status=${filter}&limit=50`);
      const data = await res.json();
      setPosts(data.data || []);
    } catch { toast.error("Gagal memuat"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/mading/posts?status=${filter}&limit=50`);
        const data = await res.json();
        if (!cancelled) setPosts(data.data || []);
      } catch { toast.error("Gagal memuat"); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [filter]);

  const handleStatus = async (postId: number, action: string) => {
    if ((action === "rejected" || action === "revision") && !note) {
      toast.error("Alasan wajib diisi"); return;
    }
    const toastId = toast.loading("Memproses...");
    try {
      const res = await fetch(`/api/mading/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) throw new Error("Gagal");
      toast.success("Status diupdate!", { id: toastId });
      setSelectedPost(null);
      setNote("");
      fetchPosts();
    } catch { toast.error("Gagal memproses", { id: toastId }); }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Moderasi Tulisan" description="Tinjau dan moderasi tulisan mading siswa." />

      <div className="flex gap-2 mb-6">
        {["pending", "approved", "rejected", "revision", "draft"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {selectedPost && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 mb-6">
          <h3 className="font-bold text-lg mb-2">{selectedPost.title}</h3>
          <p className="text-sm text-slate-500 mb-1">Penulis: {selectedPost.author_name} | Kategori: {selectedPost.category_name || "-"}</p>
          <div className="bg-slate-50 p-4 rounded-lg mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPost.content || selectedPost.excerpt || "") }} />
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Alasan/catatan (wajib untuk reject/revisi)" className="w-full border rounded p-2 mb-4 h-20" />
          <div className="flex gap-3">
            <button onClick={() => handleStatus(selectedPost.id, "approved")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"><Check className="h-4 w-4" aria-hidden="true" /> Approve</button>
            <button onClick={() => handleStatus(selectedPost.id, "revision")} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Minta Revisi</button>
            <button onClick={() => handleStatus(selectedPost.id, "rejected")} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"><X className="h-4 w-4" aria-hidden="true" /> Tolak</button>
            <button onClick={() => { setSelectedPost(null); setNote(""); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">Batal</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
            <tr>
              <th className="p-4">Judul</th>
              <th className="p-4">Penulis</th>
              <th className="p-4">Status</th>
              <th className="p-4">Tanggal</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Memuat...</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada tulisan</td></tr>
            ) : posts.map((post) => (
              <tr key={post.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-medium">{post.title}</td>
                <td className="p-4 text-sm text-slate-600">{post.author_name || "-"}</td>
                <td className="p-4"><StatusBadge status={post.status} /></td>
                <td className="p-4 text-sm text-slate-500">{new Date(post.created_at).toLocaleDateString("id-ID")}</td>
                <td className="p-4 text-right">
                  <button onClick={() => setSelectedPost(post)} className="text-sky-600 hover:text-sky-700 text-sm font-medium">Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
