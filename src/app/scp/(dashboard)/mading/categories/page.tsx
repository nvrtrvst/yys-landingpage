"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/scp/PageHeader";

interface MadingCategory {
  id: number;
  name: string;
  description: string | null;
  unit_id: number | null;
  is_active: number | boolean;
}

export default function MadingCategoriesPage() {
  const [categories, setCategories] = useState<MadingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MadingCategory | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchCats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mading/categories?all=true");
      setCategories(await res.json());
    } catch { toast.error("Gagal memuat"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/mading/categories?all=true");
        if (!cancelled) setCategories(await res.json());
      } catch { toast.error("Gagal memuat"); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Nama diperlukan"); return; }
    const toastId = toast.loading("Menyimpan...");
    try {
      const url = editing ? `/api/admin/mading/categories/${editing.id}` : "/api/mading/categories";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, unit_id: editing?.unit_id || null }),
      });
      if (!res.ok) throw new Error("Gagal");
      toast.success("Tersimpan!", { id: toastId });
      setEditing(null); setName(""); setDescription("");
      fetchCats();
    } catch { toast.error("Gagal menyimpan", { id: toastId }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin?")) return;
    try {
      const res = await fetch(`/api/mading/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      toast.success("Dihapus");
      fetchCats();
    } catch { toast.error("Gagal menghapus"); }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Kategori Mading" description="Kelola kategori tulisan mading." />

      <div className="bg-white p-6 rounded-xl border border-slate-200 mb-6">
        <h3 className="font-semibold mb-4">{editing ? "Edit Kategori" : "Tambah Kategori"}</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Nama</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded p-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Deskripsi</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded p-2" />
          </div>
          <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
            {editing ? "Update" : "Tambah"}
          </button>
          {editing && <button onClick={() => { setEditing(null); setName(""); setDescription(""); }} className="px-4 py-2 border rounded-lg text-slate-600">Batal</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">Tipe</th>
              <th className="p-4">Aktif</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Memuat...</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-medium">{cat.name}</td>
                <td className="p-4 text-sm">{cat.unit_id ? "Khusus Unit" : "Global"}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${cat.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {cat.is_active ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <XCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                    {cat.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => { setEditing(cat); setName(cat.name); setDescription(cat.description || ""); }} className="text-sky-600 hover:text-sky-700 text-sm font-medium mr-2">Edit</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-rose-600 hover:text-rose-700 text-sm font-medium">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
