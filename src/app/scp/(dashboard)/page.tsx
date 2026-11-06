import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";
import { PageHeader } from "@/components/scp/PageHeader";
import { StatCard } from "@/components/scp/StatCard";
import { badgeBase } from "@/components/scp/ui";

export default async function AdminDashboard() {
  const [
    [ppdbRows],
    [newsRows],
    [eventRows],
    [ppdbUnitStats],
    [recentPPDB],
  ] = await Promise.all([
    pool.execute<RowDataPacket[]>("SELECT COUNT(*) as count FROM ppdb_submissions"),
    pool.execute<RowDataPacket[]>("SELECT COUNT(*) as count FROM news"),
    pool.execute<RowDataPacket[]>("SELECT COUNT(*) as count FROM events WHERE start_date >= NOW() OR end_date >= NOW()"),
    pool.execute<RowDataPacket[]>("SELECT unit, COUNT(*) as count FROM ppdb_submissions GROUP BY unit"),
    pool.execute<RowDataPacket[]>("SELECT id, registration_number, student_name, unit, status, created_at FROM ppdb_submissions ORDER BY created_at DESC LIMIT 5"),
  ]);

  const stats = [
    { name: 'Total Pendaftar PPDB', stat: ppdbRows[0].count },
    { name: 'Total Berita', stat: newsRows[0].count },
    { name: 'Event / Agenda Aktif', stat: eventRows[0].count },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Dashboard Overview" description="Ringkasan aktivitas dan data terbaru." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((item) => (
          <StatCard key={item.name} label={item.name} value={item.stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-900">5 Pendaftar PPDB Terbaru</h3>
            <Link href="/scp/ppdb" className="text-sm font-medium text-primary-700 hover:text-primary-800">
              Lihat Semua &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="px-4 py-3">No. Daftar</th>
                  <th className="px-4 py-3">Nama Siswa</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPPDB.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">Belum ada pendaftar.</td></tr>
                ) : (
                  recentPPDB.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.registration_number}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.student_name}</td>
                      <td className="px-4 py-3"><span className={`${badgeBase} bg-slate-100 text-slate-600`}>{row.unit}</span></td>
                      <td className="px-4 py-3">
                        <span className={`${badgeBase} ${
                          row.status === 'Diterima' ? 'bg-emerald-50 text-emerald-700' :
                          row.status === 'Ditolak' ? 'bg-rose-50 text-rose-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {row.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">
                        {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Statistik PPDB per Unit</h3>
          </div>
          <div className="p-5">
            {ppdbUnitStats.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {ppdbUnitStats.map(stat => (
                  <div key={stat.unit} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0">
                    <span className="text-sm font-medium text-slate-700">Unit {stat.unit}</span>
                    <span className={`${badgeBase} bg-slate-100 text-slate-600`}>{stat.count} Calon</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
