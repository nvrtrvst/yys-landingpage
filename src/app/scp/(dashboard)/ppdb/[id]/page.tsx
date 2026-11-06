"use client";

import { getErrorMessage } from "@/lib/get-error-message";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { Clock, CheckCircle2, XCircle, RefreshCw, Printer } from "lucide-react";
import { useSyncPolling } from "@/lib/use-sync-polling";

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
  sync_warning: string | null;
  sync_error: string | null;
  synced_at: string | null;
  sync_attempts: number;
}

export default function PPDBDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<PPDBDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const initialAttemptsRef = useRef(0);

  const pollSync = async (): Promise<boolean> => {
    const res = await fetch(`/api/admin/ppdb/${id}`);
    if (!res.ok) return true;
    const row: PPDBDetail = await res.json();
    setData(row);
    if (row.sync_status === 'success') return true;
    if (row.sync_status === 'failed' && row.sync_attempts > initialAttemptsRef.current) return true;
    return false;
  };

  const { polling: syncing, start: startSyncPolling } = useSyncPolling(pollSync);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/ppdb/${id}`);
      if (!res.ok) throw new Error("Data tidak ditemukan");
      setData(await res.json());
    } catch(err: unknown) {
      toast.error((getErrorMessage(err)));
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
        toast.error((getErrorMessage(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const updateStatus = async (status: string) => {
    const initialAttempts = data?.sync_attempts ?? 0;
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
        initialAttemptsRef.current = initialAttempts;
        startSyncPolling();
      }
    } catch(err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
    }
  };

  const retrySync = async () => {
    const toastId = toast.loading("Menyinkronkan dengan SIM Keuangan...");
    try {
      const res = await fetch(`/api/admin/ppdb/${id}/sync`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Gagal sinkronisasi");
      if (json?.ok) {
        const warnings = Array.isArray(json.warnings) && json.warnings.length > 0 ? ` ${json.warnings.join(" ")}` : "";
        toast.success(`Berhasil sinkronisasi.${warnings}`, { id: toastId });
      } else {
        toast.error(json?.error || "Gagal sinkronisasi", { id: toastId });
      }
      fetchData();
    } catch(err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
    }
  };

  if (loading) return <div className="p-12 text-center">Memuat detail pendaftar...</div>;
  if (!data) return <div className="p-12 text-center text-rose-500">Data tidak ditemukan.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/scp/ppdb" className="text-slate-500 hover:text-slate-900 font-medium">
            &larr; Kembali
          </Link>
          <h2 className="text-3xl font-bold text-slate-800 ml-2">Detail Pendaftar PPDB</h2>
        </div>
        <Link 
          href={`/print/ppdb/${id}`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Printer className="h-4 w-4" aria-hidden="true" /> Cetak Kartu Peserta
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Nomor Pendaftaran</p>
            <p className="text-2xl font-mono font-bold text-slate-900">{data.registration_number}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Status Pendaftaran</p>
              <select 
                value={data.status} 
                onChange={(e) => updateStatus(e.target.value)}
                className={`text-sm rounded px-3 py-1.5 font-semibold outline-none border cursor-pointer ${
                  data.status === 'Diterima' ? 'bg-emerald-50 text-emerald-700 border-green-200' :
                  data.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 border-red-200' :
                  'bg-amber-50 text-amber-700 border-yellow-200'
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
          <h3 className="col-span-full text-lg font-bold border-b pb-2 text-slate-800">Data Calon Siswa</h3>
          
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
            <p className="font-semibold text-slate-900">{data.student_name}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Unit Sekolah & Kelas</label>
            <p className="font-semibold text-slate-900">{data.unit} - {data.grade} {data.major ? `(${data.major})` : ''}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">NISN</label>
            <p className="font-semibold text-slate-900">{data.nisn || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Tempat, Tanggal Lahir</label>
            <p className="font-semibold text-slate-900">{data.birth_place}, {new Date(data.birth_date).toLocaleDateString('id-ID')}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Jenis Kelamin</label>
            <p className="font-semibold text-slate-900">{data.gender}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Anak Ke / Jumlah Saudara</label>
            <p className="font-semibold text-slate-900">{data.child_order || '-'} dari {data.siblings_count || '-'} bersaudara</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Alamat Lengkap</label>
            <p className="font-semibold text-slate-900">{data.address}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Asal Sekolah Sebelumnya</label>
            <p className="font-semibold text-slate-900">{data.previous_school || '-'}</p>
          </div>

          <h3 className="col-span-full text-lg font-bold border-b pb-2 mt-4 text-slate-800">Data Orang Tua / Wali</h3>
          
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Nama Ayah</label>
            <p className="font-semibold text-slate-900">{data.father_name}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Pekerjaan Ayah</label>
            <p className="font-semibold text-slate-900">{data.father_job || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Nama Ibu</label>
            <p className="font-semibold text-slate-900">{data.mother_name}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Pekerjaan Ibu</label>
            <p className="font-semibold text-slate-900">{data.mother_job || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Nama Wali</label>
            <p className="font-semibold text-slate-900">{data.guardian_name || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Pekerjaan Wali</label>
            <p className="font-semibold text-slate-900">{data.guardian_job || '-'}</p>
          </div>

          <h3 className="col-span-full text-lg font-bold border-b pb-2 mt-4 text-slate-800">Kontak</h3>
          
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Nomor Handphone/WhatsApp</label>
            <p className="font-semibold text-slate-900">{data.phone}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Email</label>
            <p className="font-semibold text-slate-900">{data.email || '-'}</p>
          </div>
          
          <h3 className="col-span-full text-lg font-bold border-b pb-2 mt-4 text-slate-800">Sinkronisasi Sistem</h3>
          <div className="col-span-full bg-slate-50 p-4 rounded-lg border space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Status Sync SIM Keuangan</p>
                <p className={`flex items-center gap-1.5 text-sm ${
                  data.sync_status === 'success' ? 'text-emerald-600' :
                  data.sync_status === 'failed' ? 'text-rose-600' : 'text-amber-600'
                }`}>
                  {data.sync_status === 'success' ? <><CheckCircle2 className="h-4 w-4" /> Berhasil Tersinkronisasi</> :
                   data.sync_status === 'failed' ? <><XCircle className="h-4 w-4" /> Gagal Sinkronisasi</> :
                   <><Clock className="h-4 w-4" /> Menunggu Sinkronisasi</>}
                </p>
                {syncing && (
                  <p className="flex items-center gap-1 text-xs text-sky-600 mt-1">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Menyinkronkan…
                  </p>
                )}
                {data.sync_attempts > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {data.sync_attempts} percobaan{data.synced_at ? ` · terakhir ${new Date(data.synced_at).toLocaleString('id-ID')}` : ''}
                  </p>
                )}
              </div>
              {data.sync_status !== 'success' && (
                <button onClick={retrySync} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                  {data.sync_status === 'failed' ? 'Coba Lagi' : 'Sinkronkan'}
                </button>
              )}
            </div>
            {data.sync_warning && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">{data.sync_warning}</p>
            )}
            {data.sync_error && (
              <p className="text-sm text-rose-700 bg-rose-50 border border-red-200 rounded p-3">{data.sync_error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
