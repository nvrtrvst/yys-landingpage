"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function PPDBPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterUnit) query.append("unit", filterUnit);
      if (filterStatus) query.append("status", filterStatus);
      if (search) query.append("search", search);

      const res = await fetch(`/api/admin/ppdb?${query.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      setData(await res.json());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterUnit, filterStatus, search]);

  const updateStatus = async (id: number, status: string) => {
    const toastId = toast.loading("Memperbarui status...");
    try {
      const res = await fetch(`/api/admin/ppdb/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Gagal memperbarui");
      toast.success("Status diperbarui", { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
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
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Data Pendaftar PPDB</h2>
          <p className="text-gray-500">Kelola dan tinjau data calon siswa baru.</p>
        </div>
        <button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2">
          Download CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cari Nama / No Daftar</label>
          <input 
            type="text" 
            placeholder="Cari..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Unit</label>
          <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500">
            <option value="">Semua Unit</option>
            <option value="LPQ">LPQ</option>
            <option value="TK">TK</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMK">SMK</option>
          </select>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500">
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="diterima">Diterima</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                <th className="p-4 font-semibold">No Pendaftaran</th>
                <th className="p-4 font-semibold">Nama Siswa</th>
                <th className="p-4 font-semibold">Unit & Kelas</th>
                <th className="p-4 font-semibold">Tanggal Daftar</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Tidak ada data pendaftar.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{row.registration_number}</td>
                    <td className="p-4">{row.student_name}</td>
                    <td className="p-4">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-bold mr-2">{row.unit}</span>
                      <span className="text-sm text-gray-600">{row.grade} {row.major && `(${row.major})`}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <select 
                        value={row.status} 
                        onChange={(e) => updateStatus(row.id, e.target.value)}
                        className={`text-sm rounded p-1 font-semibold outline-none border ${
                          row.status === 'diterima' ? 'bg-green-100 text-green-700 border-green-200' :
                          row.status === 'ditolak' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="diterima">Diterima</option>
                        <option value="ditolak">Ditolak</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/scp/ppdb/${row.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Lihat Detail
                      </Link>
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
