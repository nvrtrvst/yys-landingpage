"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Search, Shield, Filter } from "lucide-react";

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  unit_id: number | null;
  unit_name: string | null;
  action: string;
  resource_type: string | null;
  resource_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

const actionIcons: Record<string, string> = {
  login: "🔑",
  approve: "✅",
  reject: "❌",
  revision: "🔄",
  submit: "📝",
  delete: "🗑️",
  create: "➕",
  update: "✏️",
  lockout: "🔒",
  user_create: "👤+",
  user_delete: "👤−",
  user_update: "👤✏️",
};

const actionLabels: Record<string, string> = {
  login: "Login",
  approve: "Approve",
  reject: "Reject",
  revision: "Minta Revisi",
  submit: "Submit",
  delete: "Hapus",
  create: "Buat",
  update: "Update",
  lockout: "Lockout",
  user_create: "Buat User",
  user_delete: "Hapus User",
  user_update: "Update User",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mading/audit-logs");
      if (!res.ok) throw new Error();
      setLogs(await res.json());
    } catch {
      toast.error("Gagal memuat log");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(l => {
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (l.user_name?.toLowerCase() || "").includes(q)
        || (l.details?.toLowerCase() || "").includes(q)
        || (l.action || "").includes(q);
    }
    return true;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-500 mt-1">Riwayat aktivitas sensitif sistem mading</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Cari user, aksi, atau detail..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="all">Semua Aksi</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{actionLabels[a] || a}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Detail</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="p-4"><div className="h-5 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-28 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-20 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-48 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-20 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Shield className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 font-medium">Belum ada log</p>
                    <p className="text-gray-400 text-sm mt-1">Log akan muncul saat ada aktivitas moderasi, login, atau perubahan user</p>
                  </td>
                </tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900">{log.user_name || `#${log.user_id}`}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 ring-1 ring-gray-300">
                      {actionIcons[log.action] || "•"} {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{log.details || "-"}</td>
                  <td className="p-4 text-sm text-gray-500">{log.unit_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500 bg-gray-50/50">
            Menampilkan {filtered.length} log
          </div>
        )}
      </div>
    </div>
  );
}
