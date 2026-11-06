"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { UserAvatar } from "@/components/mading/UserAvatar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { User, LogOut, Megaphone, X } from "lucide-react";

import { TABS, type MadingPost, type TabKey } from "./shared";
import { TabsGrid } from "./TabsGrid";
import { PostList } from "./PostList";
import { ReviewModal } from "./ReviewModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

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

        <TabsGrid activeTab={activeTab} counts={counts} onChange={setActiveTab} />
        <PostList posts={posts} loading={loading} activeLabel={TABS.find((t) => t.key === activeTab)?.label} deleting={deleting} onRefresh={() => { fetchCounts(); fetchList(activeTab); }} onReview={openReview} onDelete={setConfirmDelete} />
      </main>

      {selectedPost && (<ReviewModal post={selectedPost} note={note} setNote={setNote} processing={processing} loadingPost={loadingPost} onClose={() => setSelectedPost(null)} onApprove={() => handleStatus(selectedPost.id, "approved")} onRevision={() => handleStatus(selectedPost.id, "revision")} onReject={() => handleStatus(selectedPost.id, "rejected")} />)}
      {confirmDelete && (<ConfirmDeleteModal post={confirmDelete} busy={deleting !== null} isDeleting={deleting === confirmDelete.id} onCancel={() => setConfirmDelete(null)} onConfirm={() => doDelete(confirmDelete)} />)}
    </div>
  );
}
