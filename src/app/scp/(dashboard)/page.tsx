import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Fetch some stats
  const [ppdbRows] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) as count FROM ppdb_submissions");
  const [newsRows] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) as count FROM news");
  const [eventRows] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) as count FROM events WHERE start_date >= NOW() OR end_date >= NOW()");
  
  const [ppdbUnitStats] = await pool.execute<RowDataPacket[]>("SELECT unit, COUNT(*) as count FROM ppdb_submissions GROUP BY unit");
  const [recentPPDB] = await pool.execute<RowDataPacket[]>("SELECT id, registration_number, student_name, unit, status, created_at FROM ppdb_submissions ORDER BY created_at DESC LIMIT 5");

  const stats = [
    { name: 'Total Pendaftar PPDB', stat: ppdbRows[0].count },
    { name: 'Total Berita', stat: newsRows[0].count },
    { name: 'Event / Agenda Aktif', stat: eventRows[0].count },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <h2 className="text-3xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight mb-6">
        Dashboard Overview
      </h2>
      
      <dl className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-xl bg-white px-4 py-6 shadow-sm border border-gray-100 hover:border-green-200 transition-colors border-t-4 border-t-green-500">
            <dt className="truncate text-sm font-medium text-gray-500 mb-1">{item.name}</dt>
            <dd className="mt-1 text-4xl font-bold tracking-tight text-gray-900">{item.stat}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-bold leading-6 text-gray-900">5 Pendaftar PPDB Terbaru</h3>
            <Link href="/scp/ppdb" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Lihat Semua &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="p-4">No. Daftar</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">Unit</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recentPPDB.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada pendaftar.</td></tr>
                ) : (
                  recentPPDB.map(row => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{row.registration_number}</td>
                      <td className="p-4">{row.student_name}</td>
                      <td className="p-4"><span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-bold">{row.unit}</span></td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          row.status === 'diterima' ? 'bg-green-100 text-green-700' :
                          row.status === 'ditolak' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {row.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right text-sm text-gray-500">
                        {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden h-fit">
          <div className="p-6 border-b bg-gray-50">
            <h3 className="text-lg font-bold leading-6 text-gray-900">Statistik PPDB per Unit</h3>
          </div>
          <div className="p-6">
            {ppdbUnitStats.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada data</p>
            ) : (
              <div className="space-y-4">
                {ppdbUnitStats.map(stat => (
                  <div key={stat.unit} className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-gray-700">Unit {stat.unit}</span>
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full font-bold text-sm">{stat.count} Calon</span>
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
