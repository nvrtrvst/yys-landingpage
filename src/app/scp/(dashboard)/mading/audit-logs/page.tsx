"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Shield, KeyRound, CheckCircle2, XCircle, RotateCcw, FileText, Trash2, Plus, Pencil, Lock, UserPlus, UserMinus, UserCog, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/scp/PageHeader";

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

const actionIcons: Record<string, LucideIcon> = {
  login: KeyRound,
  approve: CheckCircle2,
  reject: XCircle,
  revision: RotateCcw,
  submit: FileText,
  delete: Trash2,
  create: Plus,
  update: Pencil,
  lockout: Lock,
  user_create: UserPlus,
  user_delete: UserMinus,
  user_update: UserCog,
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/mading/audit-logs");
        if (!res.ok) throw new Error();
        if (!cancelled) setLogs(await res.json());
      } catch {
        toast.error("Gagal memuat log");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Audit Log" description="Riwayat aktivitas sensitif sistem mading." />

      <div className="bg-white rounded-xl border border-slate-200 mb-6">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Cari user, aksi, atau detail..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100">
            <option value="all">Semua Aksi</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{actionLabels[a] || a}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Waktu</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Detail</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="p-4"><div className="h-5 w-24 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-28 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-20 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-48 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-20 bg-slate-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Shield className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500 font-medium">Belum ada log</p>
                    <p className="text-slate-400 text-sm mt-1">Log akan muncul saat ada aktivitas moderasi, login, atau perubahan user</p>
                  </td>
                </tr>
              ) : filtered.map(log => {
                const Icon = actionIcons[log.action];
                return (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-900">{log.user_name || `#${log.user_id}`}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700 ring-1 ring-slate-300">
                      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : <span aria-hidden="true">•</span>} {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 max-w-xs truncate">{log.details || "-"}</td>
                  <td className="p-4 text-sm text-slate-500">{log.unit_name || "-"}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 text-sm text-slate-500 bg-slate-50/50">
            Menampilkan {filtered.length} log
          </div>
        )}
      </div>
    </div>
  );
}
