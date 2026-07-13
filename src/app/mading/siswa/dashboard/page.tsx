"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { UserAvatar } from "@/components/mading/UserAvatar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  FileText, Clock, CheckCircle2, FileEdit, XCircle, User, Tag,
  LogOut, Plus, Inbox, Eye, Send, AlertCircle, ArrowLeft,
} from "lucide-react";
import { StatusBadge } from "@/components/mading/StatusBadge";
import { SubmitForReviewBtn } from "@/components/mading/SubmitForReviewBtn";
import { NotifItem } from "@/components/mading/NotifItem";

interface MadingPost {
  id: number;
  title: string;
  excerpt: string;
  cover_image: string | null;
  category_id: number | null;
  author_id: number;
  unit_id: number | null;
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

interface Notif {
  id: number;
  post_id: number | null;
  type: string;
  message: string;
  is_read: number | boolean;
  created_at: string;
}

export default function SiswaDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<MadingPost[]>([]);
  const [stats, setStats] = useState({ draft: 0, pending: 0, approved: 0, revision: 0, rejected: 0 });
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, notifRes] = await Promise.all([
        fetch("/api/mading/my-posts"),
        fetch("/api/mading/notifications"),
      ]);
      const postsData = await postsRes.json();
      const notifData = await notifRes.json();
      setPosts(postsData.data || []);
      setStats(postsData.stats || { draft: 0, pending: 0, approved: 0, revision: 0, rejected: 0 });
      setNotifs(notifData.data || []);
      setUnread(notifData.unreadCount || 0);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/mading/siswa/login"); return; }
    if (status === "authenticated" && session!.user.role !== "siswa") { router.push("/mading"); return; }
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [postsRes, notifRes] = await Promise.all([
          fetch("/api/mading/my-posts"),
          fetch("/api/mading/notifications"),
        ]);
        const postsData = await postsRes.json();
        const notifData = await notifRes.json();
        if (cancelled) return;
        setPosts(postsData.data || []);
        setStats(postsData.stats || { draft: 0, pending: 0, approved: 0, revision: 0, rejected: 0 });
        setNotifs(notifData.data || []);
        setUnread(notifData.unreadCount || 0);
      } catch {
        toast.error("Gagal memuat data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [status, session, router]);

  const markAllRead = useCallback(async () => {
    try {
      const res = await fetch("/api/mading/notifications/read-all", { method: "PATCH" });
      if (res.ok) {
        setNotifs((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
        setUnread(0);
      }
    } catch { /* ignore */ }
  }, []);

  const statCards = [
    { key: "draft", label: "Draft", value: stats.draft, icon: FileText, ring: "from-gray-500 to-gray-600" },
    { key: "pending", label: "Menunggu Review", value: stats.pending, icon: Clock, ring: "from-amber-500 to-orange-500" },
    { key: "approved", label: "Disetujui", value: stats.approved, icon: CheckCircle2, ring: "from-emerald-500 to-green-600" },
    { key: "revision", label: "Revisi", value: stats.revision, icon: FileEdit, ring: "from-sky-500 to-blue-600" },
  ];

  const visiblePosts = posts.filter((p) => !filter || p.status === filter);

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
              <h1 className="font-bold text-gray-900 truncate">{session?.user?.name || "Siswa"}</h1>
            </div>
            <span className="ml-1 px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold shrink-0">
              Siswa
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/mading" className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Mading</span>
            </Link>
            <Link href="/mading/siswa/profile" className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
              Profil
            </Link>
            <Link href="/mading/siswa/posts/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tulisan Baru</span>
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/mading" })}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Siswa</h2>
          <p className="text-gray-500 mt-1">Kelola tulisanmu dan pantau status review.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((c) => {
            const Icon = c.icon;
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(active ? null : c.key)}
                className={`text-left bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md ${active ? "border-primary-500 ring-2 ring-primary-200" : "border-gray-100"}`}
              >
                <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${c.ring} flex items-center justify-center shrink-0`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{c.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{c.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Notifications */}
        {unread > 0 && (
          <div
            onClick={markAllRead}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") markAllRead(); }}
            className="flex items-center gap-2 p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-800 cursor-pointer hover:bg-sky-100 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
            {unread} notifikasi belum dibaca — klik untuk menandai sudah dibaca
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My posts */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-bold text-gray-900">Tulisan Saya</h3>
                {!loading && visiblePosts.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                    {visiblePosts.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {filter && (
                  <button onClick={() => setFilter(null)} className="text-sm text-gray-500 hover:text-primary-600 font-medium">
                    Tampilkan semua
                  </button>
                )}
                <button onClick={load} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Segarkan
                </button>
              </div>
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
            ) : visiblePosts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
                <div className="h-14 w-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="h-7 w-7 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-700">Belum ada tulisan</p>
                <Link href="/mading/siswa/posts/create" className="inline-block mt-2 text-primary-600 font-medium text-sm hover:underline">
                  Buat tulisan pertama &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {visiblePosts.map((post) => (
                  <article key={post.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-primary-200 transition-all">
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
                            {post.status === "approved"
                              ? `Tayang ${new Date(post.published_at!).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                              : `Dibuat ${new Date(post.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                          </span>
                          <div className="flex items-center gap-3">
                            {post.status === "draft" && (
                              <>
                                <SubmitForReviewBtn postId={post.id} />
                                <Link href={`/mading/siswa/posts/${post.id}/edit`} className="text-sm text-gray-500 hover:text-primary-600 font-medium">
                                  Edit
                                </Link>
                              </>
                            )}
                            {post.status === "revision" && (
                              <>
                                <span className="inline-flex items-center gap-1 text-xs text-sky-600 max-w-[140px] truncate" title={post.revision_note || ""}>
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  {post.revision_note || "Revisi"}
                                </span>
                                <SubmitForReviewBtn postId={post.id} />
                                <Link href={`/mading/siswa/posts/${post.id}/edit`} className="text-sm text-gray-500 hover:text-primary-600 font-medium">
                                  Edit
                                </Link>
                              </>
                            )}
                            {post.status === "pending" && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                <Clock className="h-3.5 w-3.5" />
                                Menunggu review
                              </span>
                            )}
                            {post.status === "approved" && (
                              <Link href={`/mading/${post.unit_slug || ""}/${post.slug ?? post.id}`}
                                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium">
                                <Eye className="h-4 w-4" />
                                Lihat
                              </Link>
                            )}
                            {post.status === "rejected" && (
                              <>
                                <span className="inline-flex items-center gap-1 text-xs text-rose-600 max-w-[140px] truncate" title={post.revision_note || ""}>
                                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                                  {post.revision_note || "Ditolak"}
                                </span>
                                <Link href={`/mading/siswa/posts/${post.id}/edit`} className="text-sm text-gray-500 hover:text-primary-600 font-medium">
                                  Edit
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Notifikasi</h3>
            {notifs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <Send className="h-7 w-7 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Belum ada notifikasi.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifs.map((n) => (
                  <NotifItem key={n.id} id={n.id} message={n.message} createdAt={n.created_at} isRead={!!n.is_read} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
