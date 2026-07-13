"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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
    <div>
      <h2 className="text-2xl font-bold mb-6">Kategori Mading</h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
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
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
            {editing ? "Update" : "Tambah"}
          </button>
          {editing && <button onClick={() => { setEditing(null); setName(""); setDescription(""); }} className="px-4 py-2 border rounded-lg text-gray-600">Batal</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm border-b">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">Tipe</th>
              <th className="p-4">Aktif</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Memuat...</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{cat.name}</td>
                <td className="p-4 text-sm">{cat.unit_id ? "Khusus Unit" : "Global"}</td>
                <td className="p-4">{cat.is_active ? "✅" : "❌"}</td>
                <td className="p-4 text-right">
                  <button onClick={() => { setEditing(cat); setName(cat.name); setDescription(cat.description || ""); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2">Edit</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
