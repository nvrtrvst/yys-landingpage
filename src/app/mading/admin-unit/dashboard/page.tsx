import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { madingAuthOptions } from "@/lib/mading-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getStats(unitId: number | null, filterUnitId: number | null) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total, SUM(status = 'pending') as pending FROM mading_posts ${filterUnitId ? "WHERE unit_id = ?" : ""}`,
    filterUnitId ? [filterUnitId] : []
  );
  return { total: Number((rows[0] as RowDataPacket).total) || 0, pending: Number((rows[0] as RowDataPacket).pending) || 0 };
}

async function getRecentPosts(unitId: number | null, filterUnitId: number | null) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, title, status FROM mading_posts ${filterUnitId ? "WHERE unit_id = ?" : ""} ORDER BY updated_at DESC LIMIT 10`,
    filterUnitId ? [filterUnitId] : []
  );
  return rows;
}

async function getUserCounts(unitId: number | null, filterUnitId: number | null) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT role, COUNT(*) as count FROM users ${filterUnitId ? "WHERE unit_id = ?" : "WHERE unit_id IS NOT NULL"} GROUP BY role`,
    filterUnitId ? [filterUnitId] : []
  );
  const counts = { guru: 0, siswa: 0 };
  (rows as RowDataPacket[]).forEach((r: RowDataPacket) => { if (r.role === "guru") counts.guru = r.count; if (r.role === "siswa") counts.siswa = r.count; });
  return counts;
}

export default async function AdminUnitDashboard() {
  const session = await getServerSession(madingAuthOptions);
  if (!session || !["admin_unit", "admin", "superadmin"].includes(session.user.role)) redirect("/");

  const filterUnitId = session.user.role === "admin_unit" ? session.user.unit_id : null;
  const stats = await getStats(session.user.unit_id, filterUnitId);
  const recentPosts = await getRecentPosts(session.user.unit_id, filterUnitId);
  const userCounts = await getUserCounts(session.user.unit_id, filterUnitId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Admin Unit</h1>
      <p className="text-gray-500 mb-6">Selamat datang, {session.user.name}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-3xl font-bold text-green-600">{stats.total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Tulisan</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500 mt-1">Menunggu Review</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-3xl font-bold text-blue-600">{userCounts.guru}</p>
          <p className="text-sm text-gray-500 mt-1">Guru</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-3xl font-bold text-purple-600">{userCounts.siswa}</p>
          <p className="text-sm text-gray-500 mt-1">Siswa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/scp/mading/posts" className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow block">
          <h3 className="font-semibold text-gray-900">Moderasi Tulisan</h3>
          <p className="text-sm text-gray-500 mt-1">{stats.pending} tulisan menunggu review</p>
        </Link>
        <Link href="/scp/mading/users" className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow block">
          <h3 className="font-semibold text-gray-900">Kelola Pengguna</h3>
          <p className="text-sm text-gray-500 mt-1">{userCounts.guru + userCounts.siswa} user aktif</p>
        </Link>
        <Link href="/scp/mading/comments" className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow block">
          <h3 className="font-semibold text-gray-900">Moderasi Komentar</h3>
          <p className="text-sm text-gray-500 mt-1">Tinjau komentar yang terflag</p>
        </Link>
        <Link href="/scp/mading/categories" className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow block">
          <h3 className="font-semibold text-gray-900">Kategori</h3>
          <p className="text-sm text-gray-500 mt-1">Atur kategori khusus unit</p>
        </Link>
        <Link href="/mading/guru/dashboard" className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow block">
          <h3 className="font-semibold text-gray-900">Dashboard Guru</h3>
          <p className="text-sm text-gray-500 mt-1">Antrian review cepat</p>
        </Link>
      </div>

      {recentPosts.length > 0 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Tulisan Terbaru</h3>
          <div className="space-y-2">
            {(recentPosts as RowDataPacket[]).map((p: RowDataPacket) => (
              <div key={p.id} className="flex justify-between text-sm py-1">
                <span className="text-gray-900 truncate">{p.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === "approved" ? "bg-green-100 text-green-700" :
                  p.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                  p.status === "draft" ? "bg-gray-100 text-gray-600" :
                  "bg-red-100 text-red-700"
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
