"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileText, Clock, CheckCircle, XCircle, Users, UserCheck, BarChart3, Eye, EyeOff } from "lucide-react";

export default function MadingDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/mading/stats").then(r => r.json()).then(setStats).catch(() => toast.error("Gagal memuat statistik"));
  }, []);

  if (!stats) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-100 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );

  const dist = stats.statusDistribution || {};
  const totalUsers = stats.totalUsers || { guru: 0, siswa: 0 };

  const recent = stats.recentPosts || [];

  const cards = [
    { label: "Total Tulisan", value: stats.totalPosts, icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Menunggu Review", value: stats.pendingReview, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
    { label: "Disetujui", value: dist.approved || 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    { label: "Draft / Ditolak", value: (dist.draft || 0) + (dist.rejected || 0) + (dist.revision || 0), icon: XCircle, color: "text-gray-600", bg: "bg-gray-100" },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-gray-200",
    pending: "bg-yellow-400",
    approved: "bg-green-500",
    rejected: "bg-red-400",
    revision: "bg-orange-400",
  };
  const statusLabels: Record<string, string> = {
    draft: "Draft", pending: "Pending", approved: "Approved", rejected: "Ditolak", revision: "Revisi",
  };

  const totalByStatus = Object.values(dist).reduce((a: number, b: any) => a + (typeof b === "number" ? b : 0), 0) || 1;
  const statusKeys = ["draft", "pending", "approved", "rejected", "revision"].filter(k => dist[k] > 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard Mading Online</h2>
      <p className="text-sm text-gray-500 mb-6">Ringkasan aktivitas mading seluruh unit</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white border rounded-xl p-5 flex items-center gap-4">
            <div className={`h-12 w-12 ${c.bg} rounded-xl flex items-center justify-center`}>
              <c.icon className={`h-6 w-6 ${c.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-sm text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {stats.totalUsers && (
          <div className="bg-white border rounded-xl p-5 flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalUsers.guru + totalUsers.siswa}</p>
              <p className="text-sm text-gray-500">{totalUsers.guru} Guru &middot; {totalUsers.siswa} Siswa</p>
            </div>
          </div>
        )}
      </div>

      {stats.perUnit && stats.perUnit.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Statistik per Unit</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Draft</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bar</th>
                </tr>
              </thead>
              <tbody>
                {stats.perUnit.map((u: any) => {
                  const total = Number(u.total_posts) || 0;
                  const pending = Number(u.pending) || 0;
                  const approved = Number(u.approved) || 0;
                  const draft = Number(u.draft) || 0;
                  const max = Math.max(total, 1);
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4">
                        <span className="font-medium text-sm text-gray-900">{u.name}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-900 font-medium">{total}</td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${pending > 0 ? "text-yellow-600" : "text-gray-400"}`}>{pending}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${approved > 0 ? "text-green-600" : "text-gray-400"}`}>{approved}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{draft}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-0.5 h-5">
                          {pending > 0 && <div className="bg-yellow-400 rounded-sm" style={{ width: `${(pending/max)*100}%`, minWidth: pending > 0 ? "4px" : 0, height: "100%" }} />}
                          {approved > 0 && <div className="bg-green-500 rounded-sm" style={{ width: `${(approved/max)*100}%`, minWidth: approved > 0 ? "4px" : 0, height: "100%" }} />}
                          {draft > 0 && <div className="bg-gray-300 rounded-sm" style={{ width: `${(draft/max)*100}%`, minWidth: draft > 0 ? "4px" : 0, height: "100%" }} />}
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
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Distribusi Status</h3>
          {statusKeys.length === 0 ? (
            <p className="text-gray-400 text-sm">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {statusKeys.map(key => {
                const val = dist[key] as number;
                const pct = (val / totalByStatus) * 100;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{statusLabels[key]}</span>
                      <span className="font-medium text-gray-900">{val}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${statusColors[key]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/scp/mading/posts" className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium text-gray-700 text-center">
              <FileText className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
              Moderasi
            </a>
            <a href="/scp/mading/categories" className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium text-gray-700 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
              Kategori
            </a>
            <a href="/scp/mading/users" className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium text-gray-700 text-center">
              <Users className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
              Users
            </a>
            <a href="/mading" className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium text-gray-700 text-center">
              <Eye className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
              Lihat Web
            </a>
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Tulisan Terbaru</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recent.map((p: any) => (
              <div key={p.id} className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="truncate font-medium text-gray-900">{p.title}</span>
                  <span className="text-gray-400 hidden sm:inline">—</span>
                  <span className="text-gray-500 truncate hidden sm:inline">{p.author_name}</span>
                  {p.unit_name && <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{p.unit_name}</span>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ml-3 ${
                  p.status === "approved" ? "bg-green-50 text-green-700 ring-1 ring-green-700/10" :
                  p.status === "pending" ? "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-700/10" :
                  p.status === "revision" ? "bg-orange-50 text-orange-700 ring-1 ring-orange-700/10" :
                  p.status === "rejected" ? "bg-red-50 text-red-700 ring-1 ring-red-700/10" :
                  "bg-gray-50 text-gray-600 ring-1 ring-gray-300"
                }`}>{statusLabels[p.status] || p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
