"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import DOMPurify from "isomorphic-dompurify";
import { UserAvatar } from "@/components/mading/UserAvatar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Clock, CheckCircle2, FileEdit, XCircle, User, Tag, LogOut,
  Inbox, Eye, AlertCircle, Send, Trash2, Megaphone, X,
} from "lucide-react";
import { StatusBadge } from "@/components/mading/StatusBadge";

interface MadingPost {
  id: number;
  title: string;
  excerpt: string;
  cover_image: string | null;
  category_id: number | null;
  author_id: number;
  unit_id: number | null;
  content?: string;
  status: "draft" | "pending" | "approved" | "rejected" | "revision";
  revision_note: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  category_name: string | null;
  category_slug: string | null;
  unit_slug: string | null;
  slug: string | null;
  views: number;
}

const TABS = [
  { key: "pending", label: "Menunggu Review", icon: Clock, ring: "from-amber-500 to-orange-500" },
  { key: "approved", label: "Disetujui", icon: CheckCircle2, ring: "from-emerald-500 to-green-600" },
  { key: "revision", label: "Revisi", icon: FileEdit, ring: "from-sky-500 to-blue-600" },
  { key: "rejected", label: "Ditolak", icon: XCircle, ring: "from-rose-500 to-red-600" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function GuruDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<MadingPost[]>([]);
  const [counts, setCounts] = useState<Record<TabKey, number>>({ pending: 0, approved: 0, revision: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<MadingPost | null>(null);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MadingPost | null>(null);

  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annCover, setAnnCover] = useState<string | null>(null);
  const [annUploading, setAnnUploading] = useState(false);
  const [annSubmitting, setAnnSubmitting] = useState(false);
  const [annError, setAnnError] = useState("");

  const fetchCounts = useCallback(async () => {
    try {
      const [p, a, r, j] = await Promise.all([
        fetch("/api/mading/posts?status=pending&limit=1"),
        fetch("/api/mading/posts?status=approved&limit=1"),
        fetch("/api/mading/posts?status=revision&limit=1"),
        fetch("/api/mading/posts?status=rejected&limit=1"),
      ]);
      const pd = await p.json();
      const ad = await a.json();
      const rd = await r.json();
      const jd = await j.json();
      setCounts({
        pending: pd.total ?? 0,
        approved: ad.total ?? 0,
        revision: rd.total ?? 0,
        rejected: jd.total ?? 0,
      });
    } catch {
      /* ignore */
    }
  }, []);

  const fetchList = useCallback(async (tab: TabKey) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mading/posts?status=${tab}&limit=50`);
      const data = await res.json();
      setPosts(data.data || []);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/mading/siswa/login"); return; }
    if (status === "authenticated" && !["guru", "admin_unit", "admin", "superadmin"].includes(session!.user.role)) {
      router.push("/mading");
      return;
    }
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [p, a, r, j] = await Promise.all([
          fetch("/api/mading/posts?status=pending&limit=1"),
          fetch("/api/mading/posts?status=approved&limit=1"),
          fetch("/api/mading/posts?status=revision&limit=1"),
          fetch("/api/mading/posts?status=rejected&limit=1"),
        ]);
        const pd = await p.json();
        const ad = await a.json();
        const rd = await r.json();
        const jd = await j.json();
        if (cancelled) return;
        setCounts({
          pending: pd.total ?? 0,
          approved: ad.total ?? 0,
          revision: rd.total ?? 0,
          rejected: jd.total ?? 0,
        });
      } catch {
        /* ignore */
      }
      try {
        const res = await fetch(`/api/mading/posts?status=${activeTab}&limit=50`);
        const data = await res.json();
        if (cancelled) return;
        setPosts(data.data || []);
      } catch {
        toast.error("Gagal memuat data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [status, session, router, activeTab]);

  const afterChange = () => {
    setSelectedPost(null);
    setNote("");
    fetchCounts();
    fetchList(activeTab);
  };

  const handleStatus = async (postId: number, action: string) => {
    if ((action === "rejected" || action === "revision") && !note.trim()) {
      toast.error("Alasan wajib diisi");
      return;
    }
    setProcessing(true);
    const toastId = toast.loading("Memproses...");
    try {
      const res = await fetch(`/api/mading/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note.trim() }),
      });
      if (!res.ok) throw new Error("Gagal");
      const labels: Record<string, string> = {
        approved: "Tulisan disetujui!",
        revision: "Tulisan diminta revisi",
        rejected: "Tulisan ditolak",
      };
      toast.success(labels[action] || "Status diupdate!", { id: toastId });
      afterChange();
    } catch {
      toast.error("Gagal memproses", { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const openReview = async (post: MadingPost) => {
    setLoadingPost(true);
    setNote("");
    try {
      const res = await fetch(`/api/mading/posts/${post.id}`);
      const data = await res.json();
      setSelectedPost(data && data.id ? data : post);
    } catch {
      setSelectedPost(post);
    } finally {
      setLoadingPost(false);
    }
  };

  const doDelete = async (post: MadingPost) => {
    setDeleting(post.id);
    try {
      const res = await fetch(`/api/mading/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      toast.success("Tulisan dihapus");
      afterChange();
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleAnnImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnnUploading(true);
    setAnnError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/mading/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setAnnError(data.error || "Gagal upload gambar"); return; }
      setAnnCover(data.url);
    } catch {
      setAnnError("Gagal upload gambar");
    } finally {
      setAnnUploading(false);
    }
  };

  const submitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnError("");
    setAnnSubmitting(true);
    try {
      const res = await fetch("/api/mading/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle.trim(),
          content: annContent.trim(),
          category_slug: "pengumuman",
          cover_image: annCover,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAnnError(data.error || "Gagal membuat pengumuman"); setAnnSubmitting(false); return; }
      const st = await fetch(`/api/mading/posts/${data.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approved" }),
      });
      if (!st.ok) toast.error("Pengumuman dibuat tapi gagal dipublikasikan");
      else toast.success("Pengumuman dipublikasikan!");
      setShowAnnForm(false);
      setAnnTitle(""); setAnnContent(""); setAnnCover(null);
      setActiveTab("approved");
      fetchCounts();
      fetchList("approved");
    } catch {
      setAnnError("Kesalahan server. Coba lagi.");
    } finally {
      setAnnSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
           <div className="flex items-center gap-3 min-w-0">
             <UserAvatar name={session?.user?.name} photo={session?.user?.photo} size={44} className="rounded-xl" />
             <div className="min-w-0">
              <p className="text-sm text-gray-500 leading-tight">Halo,</p>
              <h1 className="font-bold text-gray-900 truncate">{session?.user?.name || "Guru"}</h1>
            </div>
            <span className="ml-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold shrink-0">
              Guru
            </span>
          </div>
            <Link
              href="/mading/guru/profile"
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <span className="hidden sm:inline">Profil</span>
              <User className="h-4 w-4 sm:hidden" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: `${window.location.origin}/mading` })}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Moderasi</h2>
            <p className="text-gray-500 mt-1">Kelola &amp; review tulisan siswa sebelum dipublikasikan.</p>
          </div>
          <button
            onClick={() => setShowAnnForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shrink-0"
          >
            <Megaphone className="h-4 w-4" />
            Tulis Pengumuman
          </button>
        </div>

        {showAnnForm && (
          <form onSubmit={submitAnnouncement} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-red-600" /> Buat Pengumuman
              </h3>
              <button type="button" onClick={() => setShowAnnForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {annError && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{annError}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
              <input type="text" required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Judul pengumuman..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Sampul (opsional)</label>
              <input type="file" accept="image/*" onChange={handleAnnImage} disabled={annUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
              {annUploading && <p className="text-xs text-gray-400 mt-1">Mengupload...</p>}
              {annCover && (
                <div className="mt-2 relative inline-block">
                  <img src={annCover} alt="Cover" className="h-32 rounded-lg object-cover" />
                  <button type="button" onClick={() => setAnnCover(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman</label>
              <textarea required value={annContent} onChange={(e) => setAnnContent(e.target.value)} rows={6}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-y"
                placeholder="Tulis isi pengumuman..." />
            </div>
            <button type="submit" disabled={annSubmitting}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
              {annSubmitting ? "Mempublikasikan..." : "Publikasikan"}
            </button>
          </form>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`text-left bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md ${
                  active ? "border-primary-300 ring-2 ring-primary-100" : "border-gray-100"
                }`}
              >
                <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${t.ring} flex items-center justify-center shrink-0`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{counts[t.key]}</p>
                  <p className="text-sm text-gray-500 mt-1">{t.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900">
                {TABS.find((t) => t.key === activeTab)?.label}
              </h3>
              {!loading && posts.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                  {posts.length}
                </span>
              )}
            </div>
            <button
              onClick={() => { fetchCounts(); fetchList(activeTab); }}
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
                              onClick={() => openReview(post)}
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
                            onClick={() => setConfirmDelete(post)}
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
      </main>

      {/* Review modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !processing && setSelectedPost(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <StatusBadge status={selectedPost.status} />
                  {selectedPost.category_slug === "pengumuman" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      <AlertCircle className="h-3 w-3" />
                      PENGUMUMAN
                    </span>
                  )}
                  {selectedPost.category_name && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Tag className="h-3 w-3" />
                      {selectedPost.category_name}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-snug pr-4">{selectedPost.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Oleh <span className="font-medium text-gray-600">{selectedPost.author_name}</span> •{" "}
                  {new Date(selectedPost.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => !processing && setSelectedPost(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                disabled={processing}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {selectedPost.cover_image && (
                <img
                  src={selectedPost.cover_image}
                  alt={selectedPost.title}
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
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPost.content || selectedPost.excerpt || "") }}
                />
              )}

              {selectedPost.status === "revision" && selectedPost.revision_note && (
                <div className="mt-4 flex gap-2 p-3 rounded-xl bg-sky-50 text-sky-800 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">Catatan revisi sebelumnya</p>
                    <p>{selectedPost.revision_note}</p>
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
                onClick={() => handleStatus(selectedPost.id, "approved")}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Setujui
              </button>
              <button
                onClick={() => handleStatus(selectedPost.id, "revision")}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                <FileEdit className="h-4 w-4" />
                Minta Revisi
              </button>
              <button
                onClick={() => handleStatus(selectedPost.id, "rejected")}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-rose-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900">Hapus tulisan?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  &quot;{confirmDelete.title}&quot; akan dihapus permanen. Tindakan tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting !== null}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => doDelete(confirmDelete)}
                disabled={deleting !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting === confirmDelete.id ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
