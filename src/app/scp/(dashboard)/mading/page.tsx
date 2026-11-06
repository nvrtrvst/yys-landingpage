"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileText, Clock, CheckCircle, XCircle, Users, BarChart3, Eye } from "lucide-react";
import { PageHeader } from "@/components/scp/PageHeader";

interface MadingUnitStat {
  id: number;
  name: string;
  total_posts: number | string;
  pending: number | string;
  approved: number | string;
  draft: number | string;
}

interface MadingRecentPost {
  id: number;
  title: string;
  author_name: string;
  unit_name: string | null;
  status: string;
}

interface MadingStats {
  totalPosts: number;
  pendingReview: number;
  statusDistribution: Record<string, number>;
  totalUsers?: { guru: number; siswa: number };
  perUnit?: MadingUnitStat[];
  recentPosts?: MadingRecentPost[];
}

export default function MadingDashboardPage() {
  const [stats, setStats] = useState<MadingStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/mading/stats");
        const json = await res.json();
        if (!cancelled) setStats(json);
      } catch {
        toast.error("Gagal memuat statistik");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!stats) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-100 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl" />)}
      </div>
      <div className="h-64 bg-slate-100 rounded-xl" />
    </div>
  );

  const dist = stats.statusDistribution || {};
  const totalUsers = stats.totalUsers || { guru: 0, siswa: 0 };

  const recent = stats.recentPosts || [];

  const cards = [
    { label: "Total Tulisan", value: stats.totalPosts, icon: FileText, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Menunggu Review", value: stats.pendingReview, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Disetujui", value: dist.approved || 0, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Draft / Ditolak", value: (dist.draft || 0) + (dist.rejected || 0) + (dist.revision || 0), icon: XCircle, color: "text-slate-600", bg: "bg-slate-100" },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-slate-200",
    pending: "bg-amber-400",
    approved: "bg-emerald-500",
    rejected: "bg-rose-400",
    revision: "bg-amber-600",
  };
  const statusLabels: Record<string, string> = {
    draft: "Draft", pending: "Pending", approved: "Approved", rejected: "Ditolak", revision: "Revisi",
  };

  const totalByStatus = Object.values(dist).reduce((a: number, b: number) => a + (typeof b === "number" ? b : 0), 0) || 1;
  const statusKeys = ["draft", "pending", "approved", "rejected", "revision"].filter(k => dist[k] > 0);

  return (
    <div>
      <PageHeader title="Dashboard Mading Online" description="Ringkasan aktivitas mading seluruh unit." />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
            <div className={`h-12 w-12 ${c.bg} rounded-xl flex items-center justify-center`}>
              <c.icon className={`h-6 w-6 ${c.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              <p className="text-sm text-slate-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {stats.totalUsers && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
            <div className="h-12 w-12 bg-primary-50 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalUsers.guru + totalUsers.siswa}</p>
              <p className="text-sm text-slate-500">{totalUsers.guru} Guru &middot; {totalUsers.siswa} Siswa</p>
            </div>
          </div>
        )}
      </div>

      {stats.perUnit && stats.perUnit.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Statistik per Unit</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Draft</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bar</th>
                </tr>
              </thead>
              <tbody>
                {stats.perUnit.map((u: MadingUnitStat) => {
                  const total = Number(u.total_posts) || 0;
                  const pending = Number(u.pending) || 0;
                  const approved = Number(u.approved) || 0;
                  const draft = Number(u.draft) || 0;
                  const max = Math.max(total, 1);
                  return (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-4">
                        <span className="font-medium text-sm text-slate-900">{u.name}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-900 font-medium">{total}</td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${pending > 0 ? "text-amber-600" : "text-slate-400"}`}>{pending}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${approved > 0 ? "text-emerald-600" : "text-slate-400"}`}>{approved}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{draft}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-0.5 h-5">
                          {pending > 0 && <div className="bg-amber-400 rounded-sm" style={{ width: `${(pending/max)*100}%`, minWidth: pending > 0 ? "4px" : 0, height: "100%" }} />}
                          {approved > 0 && <div className="bg-emerald-500 rounded-sm" style={{ width: `${(approved/max)*100}%`, minWidth: approved > 0 ? "4px" : 0, height: "100%" }} />}
                          {draft > 0 && <div className="bg-slate-300 rounded-sm" style={{ width: `${(draft/max)*100}%`, minWidth: draft > 0 ? "4px" : 0, height: "100%" }} />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Distribusi Status</h3>
          {statusKeys.length === 0 ? (
            <p className="text-slate-400 text-sm">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {statusKeys.map(key => {
                const val = dist[key] as number;
                const pct = (val / totalByStatus) * 100;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{statusLabels[key]}</span>
                      <span className="font-medium text-slate-900">{val}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${statusColors[key]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/scp/mading/posts" className="p-4 bg-slate-50 rounded-xl hover:bg-primary-50 hover:text-primary-700 transition-colors text-sm font-medium text-slate-700 text-center">
              <FileText className="h-5 w-5 mx-auto mb-1.5 text-slate-400" />
              Moderasi
            </Link>
            <Link href="/scp/mading/categories" className="p-4 bg-slate-50 rounded-xl hover:bg-primary-50 hover:text-primary-700 transition-colors text-sm font-medium text-slate-700 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-1.5 text-slate-400" />
              Kategori
            </Link>
            <Link href="/scp/mading/users" className="p-4 bg-slate-50 rounded-xl hover:bg-primary-50 hover:text-primary-700 transition-colors text-sm font-medium text-slate-700 text-center">
              <Users className="h-5 w-5 mx-auto mb-1.5 text-slate-400" />
              Users
            </Link>
            <Link href="/mading" className="p-4 bg-slate-50 rounded-xl hover:bg-primary-50 hover:text-primary-700 transition-colors text-sm font-medium text-slate-700 text-center">
              <Eye className="h-5 w-5 mx-auto mb-1.5 text-slate-400" />
              Lihat Web
            </Link>
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Tulisan Terbaru</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.map((p: MadingRecentPost) => (
              <div key={p.id} className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="truncate font-medium text-slate-900">{p.title}</span>
                  <span className="text-slate-400 hidden sm:inline">—</span>
                  <span className="text-slate-500 truncate hidden sm:inline">{p.author_name}</span>
                  {p.unit_name && <span className="text-slate-400 text-xs bg-slate-100 px-2 py-0.5 rounded-full">{p.unit_name}</span>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ml-3 ${
                  p.status === "approved" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10" :
                  p.status === "pending" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-700/10" :
                  p.status === "revision" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-700/10" :
                  p.status === "rejected" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-700/10" :
                  "bg-slate-50 text-slate-600 ring-1 ring-slate-300"
                }`}>{statusLabels[p.status] || p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
