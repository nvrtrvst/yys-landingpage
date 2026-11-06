"use client";

import { getErrorMessage } from "@/lib/get-error-message";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Loader2, Printer, Download, Search, Inbox } from "lucide-react";

interface PPDBRow {
  id: number;
  registration_number: string;
  student_name: string;
  unit: string;
  grade: string;
  major: string | null;
  status: string;
  sync_status: string;
  sync_warning: string | null;
  sync_attempts: number;
  created_at: string;
  updated_at: string | null;
  updated_by_name: string | null;
  last_action: string | null;
  is_printed: boolean;
  birth_place: string;
  birth_date: string;
  phone: string;
  previous_school: string | null;
  father_name: string;
  mother_name: string;
  nisn: string | null;
  email: string | null;
}

export default function PPDBPage() {
  const [data, setData] = useState<PPDBRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterUnit, setFilterUnit] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPrint, setFilterPrint] = useState("");
  const [filterSync, setFilterSync] = useState("");
  const [filterIncomplete, setFilterIncomplete] = useState("");
  const [search, setSearch] = useState("");
  const [pollingIds, setPollingIds] = useState<Set<number>>(new Set());
  const pollTimersRef = useRef<Record<number, ReturnType<typeof setInterval>>>({});
  const initialAttemptsRef = useRef<Record<number, number>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterUnit) query.append("unit", filterUnit);
      if (filterStatus) query.append("status", filterStatus);
      if (filterPrint) query.append("print_status", filterPrint);
      if (filterSync) query.append("sync", filterSync);
      if (filterIncomplete === "1") query.append("incomplete", "1");
      if (search) query.append("search", search);

      const res = await fetch(`/api/admin/ppdb?${query.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      setData(await res.json());
    } catch(err: unknown) {
      toast.error((getErrorMessage(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchData already depends on these filters
  }, [filterUnit, filterStatus, filterPrint, filterSync, filterIncomplete, search]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const print = params.get("print_status");
    const sync = params.get("sync");
    const incomplete = params.get("incomplete");
    // URL params are client-only; apply them once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (status) setFilterStatus(status);
    if (print) setFilterPrint(print);
    if (sync) setFilterSync(sync);
    if (incomplete) setFilterIncomplete(incomplete);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(pollTimersRef.current).forEach((timer) => clearInterval(timer));
      pollTimersRef.current = {};
    };
  }, []);

  const stopPolling = (id: number) => {
    const timer = pollTimersRef.current[id];
    if (timer) {
      clearInterval(timer);
      delete pollTimersRef.current[id];
    }
    setPollingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const startPolling = (id: number) => {
    if (pollTimersRef.current[id]) return;
    setPollingIds((prev) => new Set(prev).add(id));
    const initial = initialAttemptsRef.current[id] ?? 0;
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/admin/ppdb/${id}`);
        if (!res.ok) {
          stopPolling(id);
          return;
        }
        const row = await res.json();
        setData((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, sync_status: row.sync_status, sync_warning: row.sync_warning, sync_attempts: row.sync_attempts }
              : item
          )
        );
        const done =
          row.sync_status === 'success' ||
          (row.sync_status === 'failed' && Number(row.sync_attempts ?? 0) > initial);
        if (done || attempts >= 8) stopPolling(id);
      } catch {
        if (attempts >= 8) stopPolling(id);
      }
    };

    void tick();
    pollTimersRef.current[id] = setInterval(tick, 2000);
  };

  const updateStatus = async (id: number, status: string) => {
    const initialAttempts = data.find((row) => row.id === id)?.sync_attempts ?? 0;
    const toastId = toast.loading("Memperbarui status...");
    try {
      const res = await fetch(`/api/admin/ppdb/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Gagal memperbarui");
      toast.success("Status diperbarui", { id: toastId });
      await fetchData();
      if (status === 'Diterima') {
        initialAttemptsRef.current[id] = initialAttempts;
        startPolling(id);
      }
    } catch(err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
    }
  };

  const handlePrintCard = async (id: number) => {
    try {
      await fetch(`/api/admin/ppdb/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_printed: true })
      });
      fetchData(); // Refresh list to show printed status
      window.open(`/print/ppdb/${id}`, "_blank");
    } catch (err) {
      toast.error("Gagal mencetak kartu");
    }
  };

  const handleMassPrint = async () => {
    const idsToPrint = data.map(row => row.id);
    if (idsToPrint.length === 0) {
      return toast.info("Tidak ada data pendaftar pada tabel saat ini.");
    }
    
    const url = `/print/ppdb/massal?ids=${idsToPrint.join(',')}`;
    window.open(url, "_blank");

    const toastId = toast.loading("Menandai sebagai dicetak...");
    try {
      await fetch('/api/admin/ppdb/mass-print', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToPrint })
      });
      toast.success("Berhasil ditandai", { id: toastId });
      fetchData();
    } catch(err) {
      toast.error("Gagal menandai status", { id: toastId });
    }
  };

  const handleSyncAll = async () => {
    if (syncing) return;
    setSyncing(true);
    const toastId = toast.loading("Menyinkronkan pendaftar Diterima...");
    try {
      const res = await fetch("/api/admin/ppdb/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statuses: ["pending", "failed"] }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Gagal sinkronisasi");
      const s = json.summary || {};
      toast.success(
        `Sync selesai: ${s.success ?? 0} baru, ${s.alreadyExists ?? 0} sudah ada, ${s.failed ?? 0} gagal`,
        { id: toastId }
      );
      fetchData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err), { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const exportCSV = () => {
    if (data.length === 0) return toast.error("Tidak ada data untuk diexport");
    
    const headers = ["No Pendaftaran", "Nama Lengkap", "Unit", "Kelas", "Jurusan", "Status", "Status Sync", "Tanggal Daftar", "Tempat Lahir", "Tanggal Lahir", "No HP", "Asal Sekolah", "Nama Ayah", "Nama Ibu"];
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = [
        row.registration_number,
        `"${row.student_name}"`,
        row.unit,
        `"${row.grade}"`,
        `"${row.major || ''}"`,
        row.status,
        row.sync_status,
        new Date(row.created_at).toLocaleDateString("id-ID"),
        `"${row.birth_place}"`,
        row.birth_date,
        row.phone,
        `"${row.previous_school || ''}"`,
        `"${row.father_name}"`,
        `"${row.mother_name}"`
      ];
      csvRows.push(values.join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_PPDB_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Data Pendaftar PPDB</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola, tinjau, dan sinkronkan data calon siswa baru.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMassPrint}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" /> Cetak Masal
          </button>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Sinkronkan
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Cetak kelulusan</span>
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Link
            href="/scp/print-kelulusan?status=Diterima"
            target="_blank"
            className="inline-flex items-center gap-1.5 border-r border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Diterima
          </Link>
          <Link
            href="/scp/print-kelulusan?status=Ditolak"
            target="_blank"
            className="inline-flex items-center gap-1.5 border-r border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Ditolak
          </Link>
          <Link
            href="/scp/print-kelulusan?status=Proses"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr]">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Cari</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Nama atau no. pendaftaran…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Unit</label>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Semua unit</option>
              <option value="LPQ">LPQ</option>
              <option value="TK">TK</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMK">SMK</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Semua status</option>
              <option value="Proses">Pending</option>
              <option value="Diterima">Diterima</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Cetak</label>
            <select
              value={filterPrint}
              onChange={(e) => setFilterPrint(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Semua</option>
              <option value="unprinted">Belum dicetak</option>
              <option value="printed">Sudah dicetak</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Sync</label>
            <select
              value={filterSync}
              onChange={(e) => setFilterSync(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Semua</option>
              <option value="pending">Menunggu</option>
              <option value="success">Berhasil</option>
              <option value="failed">Gagal</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Berkas</label>
            <select
              value={filterIncomplete}
              onChange={(e) => setFilterIncomplete(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Semua</option>
              <option value="1">Belum lengkap</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">No. Pendaftaran</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Nama Siswa</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Unit & Kelas</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Tanggal Daftar</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Terakhir diubah</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Sync</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">Memuat data pendaftar…</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <Inbox className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Belum ada data pendaftar</p>
                    <p className="mt-1 text-sm text-slate-500">Ubah filter atau tunggu pendaftaran masuk.</p>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                      {row.registration_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{row.student_name}</p>
                      {row.nisn && <p className="text-xs text-slate-400">NISN {row.nisn}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                        {row.unit}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {row.grade}{row.major ? ` · ${row.major}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(row.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.updated_by_name ? (
                        <div>
                          <p className="font-medium text-slate-700">{row.updated_by_name}</p>
                          {row.updated_at ? (
                            <p className="text-slate-400">
                              {new Date(row.updated_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.status}
                        onChange={(e) => updateStatus(row.id, e.target.value)}
                        className={`h-8 rounded-md border px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-100 ${
                          row.status === "Diterima"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : row.status === "Ditolak"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        <option value="Proses">Pending</option>
                        <option value="Diterima">Diterima</option>
                        <option value="Ditolak">Ditolak</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {pollingIds.has(row.id) ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyinkronkan…
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                              row.sync_status === "success"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.sync_status === "failed"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {row.sync_status === "success" ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : row.sync_status === "failed" ? (
                              <XCircle className="h-3.5 w-3.5" />
                            ) : (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                            {row.sync_status === "success"
                              ? "Sinkron"
                              : row.sync_status === "failed"
                                ? "Gagal"
                                : "Menunggu"}
                          </span>
                        )}
                        {row.sync_warning && !pollingIds.has(row.id) && (
                          <span title={row.sync_warning} className="inline-flex items-center text-amber-500">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePrintCard(row.id)}
                          title={row.is_printed ? "Sudah dicetak" : "Cetak kartu"}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors hover:bg-slate-100 ${
                            row.is_printed ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          <Printer className="h-3.5 w-3.5" /> {row.is_printed ? "Dicetak" : "Cetak"}
                        </button>
                        <Link
                          href={`/scp/ppdb/${row.id}`}
                          className="inline-flex items-center rounded-md px-2 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
                        >
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
