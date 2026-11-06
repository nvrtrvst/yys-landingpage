import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AlertTriangle, CheckCircle2, Clock, FileWarning, Printer, RefreshCw, Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { firstAccessibleHref, hasModuleAccess } from "@/lib/modules";
import { PageHeader } from "@/components/scp/PageHeader";
import { StatCard } from "@/components/scp/StatCard";
import { badgeBase } from "@/components/scp/ui";

const activityLabels: Record<string, string> = {
  created: "Pendaftaran baru",
  status_changed: "Ubah status",
  printed: "Cetak kartu",
  print_reset: "Batalkan tanda cetak",
  card_emailed: "Kirim kartu",
  sync_auto: "Sinkronisasi otomatis",
  sync_manual: "Sinkronisasi manual",
  sync_failed: "Sinkronisasi gagal",
  deactivated: "Nonaktifkan di SIM",
};

function statusBadge(status: string) {
  if (status === "Diterima") return "bg-emerald-50 text-emerald-700";
  if (status === "Ditolak") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-700";
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (
    session?.user.role === "petugas" &&
    !hasModuleAccess("petugas", session.user.permissions, "dashboard")
  ) {
    redirect(firstAccessibleHref("petugas", session.user.permissions) ?? "/scp/no-access");
  }

  const [
    [statusRows],
    [periodRows],
    [unitRows],
    [genderRows],
    [syncRows],
    [printRows],
    [incompleteRows],
    [trendRows],
    [recentRows],
    [activityRows],
    [failedRows],
    [configRows],
    [contentRows],
  ] = await Promise.all([
    pool.execute<RowDataPacket[]>("SELECT status, COUNT(*) count FROM ppdb_submissions GROUP BY status"),
    pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) total,
        COALESCE(SUM(created_at >= CURDATE()), 0) today,
        COALESCE(SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)), 0) last7,
        COALESCE(SUM(created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)), 0) prev7
       FROM ppdb_submissions`
    ),
    pool.execute<RowDataPacket[]>("SELECT unit, COUNT(*) count FROM ppdb_submissions GROUP BY unit ORDER BY count DESC"),
    pool.execute<RowDataPacket[]>("SELECT gender, COUNT(*) count FROM ppdb_submissions GROUP BY gender"),
    pool.execute<RowDataPacket[]>("SELECT sync_status, COUNT(*) count FROM ppdb_submissions GROUP BY sync_status"),
    pool.execute<RowDataPacket[]>(
      "SELECT COALESCE(SUM(is_printed = 1), 0) printed, COALESCE(SUM(is_printed = 0 OR is_printed IS NULL), 0) unprinted FROM ppdb_submissions"
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) count FROM ppdb_submissions WHERE
        nisn IS NULL OR nisn = '' OR email IS NULL OR email = '' OR
        student_photo IS NULL OR kk_document IS NULL OR
        birth_cert_document IS NULL OR diploma_document IS NULL`
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') date_key, COUNT(*) count
       FROM ppdb_submissions
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
       GROUP BY date_key`
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT id, registration_number, student_name, unit, grade, status, created_at, updated_by_name, updated_at
       FROM ppdb_submissions ORDER BY created_at DESC LIMIT 8`
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT a.action, a.actor_name, a.old_value, a.new_value, a.note, a.created_at,
              p.id, p.registration_number, p.student_name
       FROM ppdb_activity_logs a
       LEFT JOIN ppdb_submissions p ON p.id = a.ppdb_id
       ORDER BY a.created_at DESC, a.id DESC LIMIT 8`
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT id, student_name, registration_number, sync_error
       FROM ppdb_submissions WHERE sync_status = 'failed' ORDER BY updated_at DESC, id DESC LIMIT 5`
    ),
    pool.execute<RowDataPacket[]>(
      "SELECT setting_value FROM settings WHERE setting_key = 'ppdb_config' LIMIT 1"
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM news) news_count,
        (SELECT COUNT(*) FROM events WHERE start_date >= NOW() OR end_date >= NOW()) event_count`
    ),
  ]);

  const statusCount = Object.fromEntries(statusRows.map((row) => [row.status, Number(row.count)])) as Record<string, number>;
  const total = Number(periodRows[0]?.total ?? 0);
  const today = Number(periodRows[0]?.today ?? 0);
  const last7 = Number(periodRows[0]?.last7 ?? 0);
  const prev7 = Number(periodRows[0]?.prev7 ?? 0);
  const growth = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null;

  const pending = statusCount["Proses"] ?? 0;
  const accepted = statusCount["Diterima"] ?? 0;
  const rejected = statusCount["Ditolak"] ?? 0;
  const acceptedRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const units = unitRows.map((row) => ({ unit: String(row.unit), count: Number(row.count) }));
  const maxUnit = Math.max(1, ...units.map((row) => row.count));
  const genders = genderRows.map((row) => ({ gender: String(row.gender), count: Number(row.count) }));
  const syncCount = Object.fromEntries(syncRows.map((row) => [row.sync_status, Number(row.count)])) as Record<string, number>;
  const printed = Number(printRows[0]?.printed ?? 0);
  const unprinted = Number(printRows[0]?.unprinted ?? 0);
  const incomplete = Number(incompleteRows[0]?.count ?? 0);
  const syncFailed = syncCount["failed"] ?? 0;

  const trendMap = new Map(trendRows.map((row) => [String(row.date_key), Number(row.count)]));
  const trendDays: Array<{ key: string; label: string; count: number }> = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    trendDays.push({
      key,
      label: date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      count: trendMap.get(key) ?? 0,
    });
  }
  const maxTrend = Math.max(1, ...trendDays.map((day) => day.count));
  const trendTotal = trendDays.reduce((sum, day) => sum + day.count, 0);

  let ppdbConfig: { academic_year?: string; committee_name?: string } | null = null;
  try {
    const raw = configRows[0]?.setting_value;
    ppdbConfig = raw ? JSON.parse(raw) : null;
  } catch {
    ppdbConfig = null;
  }

  const content = contentRows[0] ?? {};

  const actions = [
    {
      label: "Menunggu proses",
      value: pending,
      hint: "Belum ditinjau",
      href: "/scp/ppdb?status=Proses",
      icon: Clock,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Sync gagal",
      value: syncFailed,
      hint: "Perlu sinkronisasi ulang",
      href: "/scp/ppdb?sync=failed",
      icon: RefreshCw,
      tone: "text-rose-600 bg-rose-50",
    },
    {
      label: "Belum dicetak",
      value: unprinted,
      hint: "Kartu peserta",
      href: "/scp/ppdb?print_status=unprinted",
      icon: Printer,
      tone: "text-sky-600 bg-sky-50",
    },
    {
      label: "Berkas kurang",
      value: incomplete,
      hint: "NISN, email, atau dokumen",
      href: "/scp/ppdb?incomplete=1",
      icon: FileWarning,
      tone: "text-slate-600 bg-slate-100",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Dashboard PPDB"
        description={
          ppdbConfig?.academic_year
            ? `Tahun ajaran ${ppdbConfig.academic_year}${ppdbConfig.committee_name ? ` · Ketua panitia ${ppdbConfig.committee_name}` : ""}`
            : "Ringkasan penerimaan peserta didik baru."
        }
        actions={
          <Link
            href="/scp/ppdb"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Users className="h-4 w-4" aria-hidden="true" /> Data Pendaftar
          </Link>
        }
      />

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Perlu tindakan</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">{item.label}</p>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.tone}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{item.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.hint}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total pendaftar" value={total} hint={growth === null ? "Belum ada pembanding" : `${last7} minggu ini (${growth >= 0 ? "+" : ""}${growth}%)`} />
        <StatCard label="Hari ini" value={today} hint="Pendaftaran masuk" />
        <StatCard label="Menunggu proses" value={pending} hint="Belum ditinjau" />
        <StatCard label="Diterima" value={accepted} hint={`${acceptedRate}% dari total`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Pendaftar per hari, 14 hari terakhir</h3>
            <p className="text-xs text-slate-500">
              {trendTotal} pendaftar · puncak {maxTrend}/hari
            </p>
          </div>
          <div className="mt-5 flex h-40 items-end gap-1" role="img" aria-label={`Tren pendaftaran 14 hari terakhir, total ${trendTotal} pendaftar`}>
            {trendDays.map((day) => (
              <div key={day.key} className="flex h-full flex-1 flex-col justify-end" title={`${day.label}: ${day.count}`}>
                <div
                  className={`w-full rounded-t ${day.count > 0 ? "bg-primary-500" : "bg-slate-100"}`}
                  style={{ height: `${Math.max((day.count / maxTrend) * 100, day.count > 0 ? 6 : 2)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>{trendDays[0]?.label}</span>
            <span>{trendDays[trendDays.length - 1]?.label}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Komposisi status</h3>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
            {accepted > 0 && <div className="bg-emerald-500" style={{ width: `${(accepted / Math.max(total, 1)) * 100}%` }} />}
            {pending > 0 && <div className="bg-amber-500" style={{ width: `${(pending / Math.max(total, 1)) * 100}%` }} />}
            {rejected > 0 && <div className="bg-rose-500" style={{ width: `${(rejected / Math.max(total, 1)) * 100}%` }} />}
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-600">Diterima</dt><dd className="font-semibold tabular-nums text-emerald-700">{accepted}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Menunggu</dt><dd className="font-semibold tabular-nums text-amber-700">{pending}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Ditolak</dt><dd className="font-semibold tabular-nums text-rose-700">{rejected}</dd></div>
          </dl>

          <h3 className="mt-6 text-base font-semibold text-slate-900">Per unit</h3>
          <div className="mt-3 space-y-3">
            {units.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada data unit.</p>
            ) : (
              units.map((item) => (
                <div key={item.unit}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.unit}</span>
                    <span className="tabular-nums text-slate-500">{item.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${(item.count / maxUnit) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <h3 className="text-base font-semibold text-slate-900">Pendaftar terbaru</h3>
            <Link href="/scp/ppdb" className="text-sm font-medium text-primary-700 hover:text-primary-800">
              Lihat semua
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="px-4 py-3">No. Daftar</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Diubah oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                      Belum ada pendaftar. Bagikan tautan PPDB untuk mulai.
                    </td>
                  </tr>
                ) : (
                  recentRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{row.registration_number}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.student_name}</td>
                      <td className="px-4 py-3">
                        <span className={`${badgeBase} bg-slate-100 text-slate-600`}>{row.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`${badgeBase} ${statusBadge(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {row.updated_by_name ?? "—"}
                        {row.updated_at ? (
                          <span className="block text-slate-400">
                            {new Date(row.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Aktivitas terbaru</h3>
          {activityRows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Belum ada perubahan tercatat.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activityRows.map((row, index) => (
                <li key={`${row.id}-${index}`} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{row.actor_name}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    {activityLabels[row.action] ?? row.action}
                    {row.student_name ? ` · ${row.student_name}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {failedRows.length > 0 ? (
            <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50/60 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Sync gagal
              </p>
              <ul className="mt-2 space-y-1 text-xs text-rose-700">
                {failedRows.map((row) => (
                  <li key={row.id} className="truncate" title={row.sync_error ?? undefined}>
                    {row.student_name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total pendaftar</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Sudah dicetak</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{printed}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Gender</p>
          <p className="mt-1 text-sm text-slate-700">
            {genders.length === 0
              ? "Belum ada data"
              : genders.map((item) => `${item.gender}: ${item.count}`).join(" · ")}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-primary-600" aria-hidden="true" /> Berita: {Number(content.news_count ?? 0)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary-600" aria-hidden="true" /> Agenda aktif: {Number(content.event_count ?? 0)}
        </span>
        <Link href="/scp/news" className="text-primary-700 hover:underline">Kelola berita</Link>
        <Link href="/scp/events" className="text-primary-700 hover:underline">Kelola agenda</Link>
      </div>
    </div>
  );
}
