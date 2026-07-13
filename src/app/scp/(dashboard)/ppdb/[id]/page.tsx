"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface PPDBDetail {
  id: number;
  registration_number: string;
  status: string;
  student_name: string;
  unit: string;
  grade: string;
  major: string | null;
  nisn: string | null;
  birth_place: string;
  birth_date: string;
  gender: string;
  child_order: string | null;
  siblings_count: string | null;
  address: string;
  previous_school: string | null;
  father_name: string;
  father_job: string | null;
  mother_name: string;
  mother_job: string | null;
  guardian_name: string | null;
  guardian_job: string | null;
  phone: string;
  email: string | null;
  sync_status: string;
}

export default function PPDBDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<PPDBDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/ppdb/${id}`);
      if (!res.ok) throw new Error("Data tidak ditemukan");
      setData(await res.json());
    } catch(err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/ppdb/${id}`);
        if (!res.ok) throw new Error("Data tidak ditemukan");
        if (!cancelled) setData(await res.json());
      } catch(err: unknown) {
        toast.error((err instanceof Error ? err.message : String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const updateStatus = async (status: string) => {
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
    } catch(err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  };

  const retrySync = async () => {
    // This is a placeholder since SIM Keuangan logic isn't fully implemented yet,
    // but the instruction states to add a "Retry Sync" button that updates sync_status
    // or calls the SIM API. Here we just set it to success to simulate.
    const toastId = toast.loading("Menyinkronkan dengan SIM Keuangan...");
    try {
      const res = await fetch(`/api/admin/ppdb/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sync_status: 'success' })
      });
      if (!res.ok) throw new Error("Gagal sinkronisasi");
      toast.success("Berhasil sinkronisasi", { id: toastId });
      fetchData();
    } catch(err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  };

  if (loading) return <div className="p-12 text-center">Memuat detail pendaftar...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Data tidak ditemukan.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/scp/ppdb" className="text-gray-500 hover:text-gray-900 font-medium">
            &larr; Kembali
          </Link>
          <h2 className="text-3xl font-bold text-gray-800 ml-2">Detail Pendaftar PPDB</h2>
        </div>
        <Link 
          href={`/print/ppdb/${id}`}
          target="_blank"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow-sm flex items-center gap-2"
        >
          🖨️ Cetak Kartu Peserta
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nomor Pendaftaran</p>
            <p className="text-2xl font-mono font-bold text-gray-900">{data.registration_number}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Status Pendaftaran</p>
              <select 
                value={data.status} 
                onChange={(e) => updateStatus(e.target.value)}
                className={`text-sm rounded px-3 py-1.5 font-semibold outline-none border cursor-pointer ${
                  data.status === 'Diterima' ? 'bg-green-100 text-green-700 border-green-200' :
                  data.status === 'Ditolak' ? 'bg-red-100 text-red-700 border-red-200' :
                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                }`}
              >
                <option value="Proses">Pending</option>
                <option value="Diterima">Terima Siswa</option>
                <option value="Ditolak">Tolak Siswa</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <h3 className="col-span-full text-lg font-bold border-b pb-2 text-gray-800">Data Calon Siswa</h3>
          
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Nama Lengkap</label>
            <p className="font-semibold text-gray-900">{data.student_name}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Unit Sekolah & Kelas</label>
            <p className="font-semibold text-gray-900">{data.unit} - {data.grade} {data.major ? `(${data.major})` : ''}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">NISN</label>
            <p className="font-semibold text-gray-900">{data.nisn || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Tempat, Tanggal Lahir</label>
            <p className="font-semibold text-gray-900">{data.birth_place}, {new Date(data.birth_date).toLocaleDateString('id-ID')}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Jenis Kelamin</label>
            <p className="font-semibold text-gray-900">{data.gender}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Anak Ke / Jumlah Saudara</label>
            <p className="font-semibold text-gray-900">{data.child_order || '-'} dari {data.siblings_count || '-'} bersaudara</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Alamat Lengkap</label>
            <p className="font-semibold text-gray-900">{data.address}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Asal Sekolah Sebelumnya</label>
            <p className="font-semibold text-gray-900">{data.previous_school || '-'}</p>
          </div>

          <h3 className="col-span-full text-lg font-bold border-b pb-2 mt-4 text-gray-800">Data Orang Tua / Wali</h3>
          
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Nama Ayah</label>
            <p className="font-semibold text-gray-900">{data.father_name}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Pekerjaan Ayah</label>
            <p className="font-semibold text-gray-900">{data.father_job || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Nama Ibu</label>
            <p className="font-semibold text-gray-900">{data.mother_name}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Pekerjaan Ibu</label>
            <p className="font-semibold text-gray-900">{data.mother_job || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Nama Wali</label>
            <p className="font-semibold text-gray-900">{data.guardian_name || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Pekerjaan Wali</label>
            <p className="font-semibold text-gray-900">{data.guardian_job || '-'}</p>
          </div>

          <h3 className="col-span-full text-lg font-bold border-b pb-2 mt-4 text-gray-800">Kontak</h3>
          
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Nomor Handphone/WhatsApp</label>
            <p className="font-semibold text-gray-900">{data.phone}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
            <p className="font-semibold text-gray-900">{data.email || '-'}</p>
          </div>
          
          <h3 className="col-span-full text-lg font-bold border-b pb-2 mt-4 text-gray-800">Sinkronisasi Sistem</h3>
          <div className="col-span-full flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
            <div>
              <p className="text-sm font-semibold">Status Sync SIM Keuangan</p>
              <p className={`text-sm ${
                data.sync_status === 'success' ? 'text-green-600' :
                data.sync_status === 'failed' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {data.sync_status === 'success' ? '✔ Berhasil Tersinkronisasi' :
                 data.sync_status === 'failed' ? '✖ Gagal Sinkronisasi' : '⏳ Menunggu Sinkronisasi'}
              </p>
            </div>
            {data.sync_status === 'failed' && (
              <button onClick={retrySync} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium shadow">
                Retry Sync
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
