"use client";
import { useState } from "react";
import { Program, Unit } from "./UnitsManager";
import { toast } from "sonner";

export function ProgramsTab({ programs, units, refresh }: { programs: Program[], units: Unit[], refresh: () => void }) {
  const [editingProgram, setEditingProgram] = useState<Partial<Program> | null>(null);
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
      
      setEditingProgram(prev => ({ ...prev, [fieldName]: data.url }));
      toast.success("Berhasil diunggah", { id: toastId });
    } catch(err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan...");
    try {
      // convert empty unit_id string to null
      const payload = { ...editingProgram };
      if (!payload.unit_id) payload.unit_id = null;
      if (typeof payload.unit_id === "string") payload.unit_id = parseInt(payload.unit_id);

      const url = payload.id ? `/api/admin/programs/${payload.id}` : `/api/admin/programs`;
      const method = payload.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      toast.success("Tersimpan!", { id: toastId });
      setEditingProgram(null);
      refresh();
    } catch(err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus program ini?")) return;
    const toastId = toast.loading("Menghapus...");
    try {
      const res = await fetch(`/api/admin/programs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      toast.success("Dihapus!", { id: toastId });
      refresh();
    } catch(err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  };

  if (editingProgram !== null) {
    return (
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{editingProgram.id ? "Edit Program" : "Tambah Program Baru"}</h3>
          <button type="button" onClick={() => setEditingProgram(null)} className="text-gray-500 hover:text-gray-700">Kembali ke Daftar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Program *</label>
            <input type="text" value={editingProgram.title || ""} onChange={e => setEditingProgram({...editingProgram, title: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Terkait Unit (Opsional)</label>
            <select value={editingProgram.unit_id || ""} onChange={e => setEditingProgram({...editingProgram, unit_id: e.target.value ? parseInt(e.target.value) : null})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500">
              <option value="">Semua Unit / Umum</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Deskripsi Program</label>
            <textarea value={editingProgram.description || ""} onChange={e => setEditingProgram({...editingProgram, description: e.target.value})} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500"></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Gambar/Ikon Program (URL)</label>
            <div className="flex gap-2 items-center">
              <input type="text" value={editingProgram.image_url || ""} onChange={e => setEditingProgram({...editingProgram, image_url: e.target.value})} className="w-full border rounded p-2 bg-gray-50" readOnly />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "image_url")} className="text-sm" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Optimal: 800 x 600 px (Rasio 4:3)</p>
            {editingProgram.image_url && <img src={editingProgram.image_url} alt="Preview" className="mt-2 h-20 object-contain" />}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Urutan Tampil (Angka)</label>
            <input type="number" value={editingProgram.order_index || 0} onChange={e => setEditingProgram({...editingProgram, order_index: parseInt(e.target.value) || 0})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={editingProgram.status || 'active'} onChange={e => setEditingProgram({...editingProgram, status: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500">
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <button type="button" onClick={() => setEditingProgram(null)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Batal</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{isSaving ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Daftar Program Unggulan</h3>
        <button onClick={() => setEditingProgram({})} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
          + Tambah Program
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b">
              <th className="p-3">Urutan</th>
              <th className="p-3">Nama Program</th>
              <th className="p-3">Unit Terkait</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">Belum ada data.</td></tr>
            ) : (
              programs.map(prog => (
                <tr key={prog.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{prog.order_index}</td>
                  <td className="p-3 font-semibold text-gray-900">{prog.title}</td>
                  <td className="p-3 text-gray-500">{prog.unit_name || <span className="italic">Semua Unit</span>}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${prog.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {prog.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditingProgram(prog)} className="text-blue-600 hover:text-blue-800 mr-3 text-sm">Edit</button>
                    <button onClick={() => handleDelete(prog.id)} className="text-red-600 hover:text-red-800 text-sm">Hapus</button>
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
