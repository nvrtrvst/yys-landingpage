"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ShieldAlert, Trash2, CheckCircle2 } from "lucide-react";

interface FlaggedComment {
  id: number;
  content: string;
  created_at: string;
  flag_reason: string | null;
  post_id: number;
  post_title: string;
  user_name: string;
  user_nis: string | null;
  user_role: string;
  user_unit_id: number | null;
}

export default function ModerasiKomentarPage() {
  const [items, setItems] = useState<FlaggedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mading/comments");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      toast.error("Gagal memuat komentar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hapus = async (id: number) => {
    if (!confirm("Hapus komentar ini secara permanen?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/mading/comments/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Gagal"); }
      toast.success("Komentar dihapus");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus");
    } finally { setBusyId(null); }
  };

  const tandaiAman = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/mading/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Gagal"); }
      toast.success("Komentar ditandai aman");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses");
    } finally { setBusyId(null); }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Moderasi Komentar</h2>
        <p className="text-sm text-gray-500 mt-1">Komentar yang terdeteksi mengandung kata tidak pantas</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Memuat...</p>
      ) : items.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <ShieldAlert className="h-10 w-10 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium">Tidak ada komentar yang perlu moderasi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <div key={c.id} className="bg-white border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-sm mb-1">
                    <span className="font-semibold text-gray-900">{c.user_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {c.user_role === "siswa" ? "Siswa" : "Guru"}
                    </span>
                    {c.user_nis && <span className="text-xs text-gray-400 font-mono">NIS {c.user_nis}</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">⚠ {c.flag_reason}</span>
                  </div>
                  <Link href={`/mading/unit/${c.post_id}`} className="text-xs text-primary-600 hover:underline">
                    {c.post_title}
                  </Link>
                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap break-words">{c.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(c.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => tandaiAman(c.id)} disabled={busyId === c.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50">
                    <CheckCircle2 className="h-4 w-4" /> Aman
                  </button>
                  <button onClick={() => hapus(c.id)} disabled={busyId === c.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50">
                    <Trash2 className="h-4 w-4" /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
