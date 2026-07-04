"use client";
import { useState } from "react";
import { Unit } from "./UnitsManager";
import { toast } from "sonner";

export function UnitsTab({ units, refresh }: { units: Unit[], refresh: () => void }) {
  const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    const toastId = toast.loading("Mengunggah...");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload");
      
      setEditingUnit(prev => ({ ...prev, [fieldName]: data.url }));
      toast.success("Berhasil diunggah", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan...");
    try {
      const url = editingUnit?.id ? `/api/admin/units/${editingUnit.id}` : `/api/admin/units`;
      const method = editingUnit?.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUnit)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      toast.success("Tersimpan!", { id: toastId });
      setEditingUnit(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus unit ini? Unit tidak dapat dihapus jika masih ada pendaftar PPDB yang terkait.")) return;
    const toastId = toast.loading("Menghapus...");
    try {
      const res = await fetch(`/api/admin/units/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      toast.success("Dihapus!", { id: toastId });
      refresh();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  if (editingUnit !== null) {
    return (
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{editingUnit.id ? "Edit Unit" : "Tambah Unit Baru"}</h3>
          <button type="button" onClick={() => setEditingUnit(null)} className="text-gray-500 hover:text-gray-700">Kembali ke Daftar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Unit *</label>
            <input type="text" value={editingUnit.name || ""} onChange={e => setEditingUnit({...editingUnit, name: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug (URL) *</label>
            <input type="text" value={editingUnit.slug || ""} onChange={e => setEditingUnit({...editingUnit, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" required />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Deskripsi Singkat</label>
            <textarea value={editingUnit.description || ""} onChange={e => setEditingUnit({...editingUnit, description: e.target.value})} rows={2} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500"></textarea>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Deskripsi Lengkap (HTML/Teks)</label>
            <textarea value={editingUnit.content || ""} onChange={e => setEditingUnit({...editingUnit, content: e.target.value})} rows={5} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500"></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Foto Utama (URL)</label>
            <div className="flex gap-2 items-center">
              <input type="text" value={editingUnit.image_url || ""} onChange={e => setEditingUnit({...editingUnit, image_url: e.target.value})} className="w-full border rounded p-2 bg-gray-50" readOnly />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "image_url")} className="text-sm" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Optimal: 1200 x 800 px (Rasio 3:2)</p>
            {editingUnit.image_url && <img src={editingUnit.image_url} alt="Preview" className="mt-2 h-20 object-contain" />}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Alamat Unit</label>
            <input type="text" value={editingUnit.address || ""} onChange={e => setEditingUnit({...editingUnit, address: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telepon Unit</label>
            <input type="text" value={editingUnit.phone || ""} onChange={e => setEditingUnit({...editingUnit, phone: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Urutan Tampil (Angka)</label>
            <input type="number" value={editingUnit.order_index || 0} onChange={e => setEditingUnit({...editingUnit, order_index: parseInt(e.target.value) || 0})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={editingUnit.status || 'active'} onChange={e => setEditingUnit({...editingUnit, status: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500">
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <button type="button" onClick={() => setEditingUnit(null)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Batal</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{isSaving ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Daftar Unit Sekolah</h3>
        <button onClick={() => setEditingUnit({})} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
          + Tambah Unit
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b">
              <th className="p-3">Urutan</th>
              <th className="p-3">Nama Unit</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">Belum ada data.</td></tr>
            ) : (
              units.map(unit => (
                <tr key={unit.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{unit.order_index}</td>
                  <td className="p-3 font-semibold text-gray-900">{unit.name}</td>
                  <td className="p-3 text-gray-500">{unit.slug}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${unit.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {unit.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditingUnit(unit)} className="text-blue-600 hover:text-blue-800 mr-3 text-sm">Edit</button>
                    <button onClick={() => handleDelete(unit.id)} className="text-red-600 hover:text-red-800 text-sm">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
