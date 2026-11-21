"use client";

import { getErrorMessage } from "@/lib/get-error-message";
import { useState } from "react";
import { Unit } from "./UnitsManager";
import { toast } from "sonner";

export function UnitsTab({ units, refresh, userRole }: { units: Unit[], refresh: () => void, userRole?: string }) {
  const isUnitAdmin = userRole === 'admin_unit';
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
    } catch(err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
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
    } catch(err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
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
    } catch(err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
    }
  };

  if (editingUnit !== null) {
    return (
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{editingUnit.id ? "Edit Unit" : "Tambah Unit Baru"}</h3>
          <button type="button" onClick={() => setEditingUnit(null)} className="text-slate-500 hover:text-slate-700">Kembali ke Daftar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Unit *</label>
            <input type="text" value={editingUnit.name || ""} onChange={e => setEditingUnit({...editingUnit, name: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug (URL) *</label>
            <input type="text" value={editingUnit.slug || ""} onChange={e => setEditingUnit({...editingUnit, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} readOnly={isUnitAdmin} className={`w-full border rounded p-2 focus:ring-2 focus:ring-primary-500 ${isUnitAdmin ? 'bg-slate-50' : ''}`} required />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Deskripsi Singkat</label>
            <textarea value={editingUnit.description || ""} onChange={e => setEditingUnit({...editingUnit, description: e.target.value})} rows={2} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500"></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Tagline / Judul Hero</label>
            <input type="text" value={editingUnit.tagline || ""} onChange={e => setEditingUnit({...editingUnit, tagline: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Gambar Carousel (satu URL per baris, maksimal 8)</label>
            <textarea
              value={Array.isArray(editingUnit.carousel_images) ? editingUnit.carousel_images.join("\n") : ""}
              onChange={e => setEditingUnit({...editingUnit, carousel_images: e.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 8)})}
              rows={4}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500"
              placeholder="/uploads/contoh-1.webp"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Video YouTube</label>
            <input type="text" value={editingUnit.youtube_url || ""} onChange={e => setEditingUnit({...editingUnit, youtube_url: e.target.value})} className="w-full border rounded p-2" placeholder="https://youtube.com/watch?v=..." />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Sejarah Unit (HTML)</label>
            <textarea value={editingUnit.history_html || ""} onChange={e => setEditingUnit({...editingUnit, history_html: e.target.value})} rows={4} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Visi</label>
            <input type="text" value={editingUnit.vision || ""} onChange={e => setEditingUnit({...editingUnit, vision: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Misi (satu per baris)</label>
            <textarea value={editingUnit.mission || ""} onChange={e => setEditingUnit({...editingUnit, mission: e.target.value})} rows={4} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Foto Profil Unit</label>
            <div className="flex gap-2 items-center">
              <input type="text" value={editingUnit.profile_image || ""} readOnly className="w-full border rounded p-2 bg-slate-50" />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "profile_image")} className="text-sm" />
            </div>
            {editingUnit.profile_image && <img src={editingUnit.profile_image} alt="Preview profil" className="mt-2 h-20 object-contain" />}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Jumlah Siswa</label>
            <input type="text" value={editingUnit.stat_students || ""} onChange={e => setEditingUnit({...editingUnit, stat_students: e.target.value})} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tahun Berdiri</label>
            <input type="text" value={editingUnit.stat_founded || ""} onChange={e => setEditingUnit({...editingUnit, stat_founded: e.target.value})} className="w-full border rounded p-2" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Deskripsi Lengkap (HTML/Teks)</label>
            <textarea value={editingUnit.content || ""} onChange={e => setEditingUnit({...editingUnit, content: e.target.value})} rows={5} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500"></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Foto Utama (URL)</label>
            <div className="flex gap-2 items-center">
              <input type="text" value={editingUnit.image_url || ""} onChange={e => setEditingUnit({...editingUnit, image_url: e.target.value})} className="w-full border rounded p-2 bg-slate-50" readOnly />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "image_url")} className="text-sm" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Optimal: 1200 x 800 px (Rasio 3:2)</p>
            {editingUnit.image_url && <img src={editingUnit.image_url} alt="Preview" className="mt-2 h-20 object-contain" />}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Logo Unit</label>
            <div className="flex gap-2 items-center">
              <input type="text" value={editingUnit.logo_url || ""} readOnly className="w-full border rounded p-2 bg-slate-50" />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "logo_url")} className="text-sm" />
            </div>
            {editingUnit.logo_url && <img src={editingUnit.logo_url} alt="Preview logo" className="mt-2 h-14 object-contain" />}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Warna Utama</label>
            <input type="color" value={editingUnit.primary_color || "#14532d"} onChange={e => setEditingUnit({...editingUnit, primary_color: e.target.value.toLowerCase()})} className="h-10 w-full border rounded p-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Warna Aksen</label>
            <input type="color" value={editingUnit.secondary_color || "#fef08a"} onChange={e => setEditingUnit({...editingUnit, secondary_color: e.target.value.toLowerCase()})} className="h-10 w-full border rounded p-1" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Background Hero</label>
            <div className="flex gap-2 items-center">
              <input type="text" value={editingUnit.hero_background || ""} readOnly className="w-full border rounded p-2 bg-slate-50" />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "hero_background")} className="text-sm" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Background Program</label>
            <div className="flex gap-2 items-center">
              <input type="text" value={editingUnit.programs_background || ""} readOnly className="w-full border rounded p-2 bg-slate-50" />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "programs_background")} className="text-sm" />
            </div>
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
            <label className="block text-sm font-medium mb-1">Email Unit</label>
            <input type="email" value={editingUnit.contact_email || ""} onChange={e => setEditingUnit({...editingUnit, contact_email: e.target.value})} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nomor WhatsApp</label>
            <input type="text" value={editingUnit.wa_number || ""} onChange={e => setEditingUnit({...editingUnit, wa_number: e.target.value})} className="w-full border rounded p-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Pesan WhatsApp</label>
            <input type="text" value={editingUnit.wa_message || ""} onChange={e => setEditingUnit({...editingUnit, wa_message: e.target.value})} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <input type="text" value={editingUnit.social_instagram || ""} onChange={e => setEditingUnit({...editingUnit, social_instagram: e.target.value})} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Facebook</label>
            <input type="text" value={editingUnit.social_facebook || ""} onChange={e => setEditingUnit({...editingUnit, social_facebook: e.target.value})} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">YouTube</label>
            <input type="text" value={editingUnit.social_youtube || ""} onChange={e => setEditingUnit({...editingUnit, social_youtube: e.target.value})} className="w-full border rounded p-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Link Peta</label>
            <input type="text" value={editingUnit.map_embed_url || ""} onChange={e => setEditingUnit({...editingUnit, map_embed_url: e.target.value})} className="w-full border rounded p-2" />
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
          <button type="button" onClick={() => setEditingUnit(null)} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">{isSaving ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Daftar Unit Sekolah</h3>
        {!isUnitAdmin ? (
          <button onClick={() => setEditingUnit({})} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2">
            + Tambah Unit
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b">
              <th className="p-3">Urutan</th>
              <th className="p-3">Nama Unit</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">Belum ada data.</td></tr>
            ) : (
              units.map(unit => (
                <tr key={unit.id} className="border-b hover:bg-slate-50">
                  <td className="p-3">{unit.order_index}</td>
                  <td className="p-3 font-semibold text-slate-900">{unit.name}</td>
                  <td className="p-3 text-slate-500">{unit.slug}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${unit.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {unit.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditingUnit(unit)} className="text-sky-600 hover:text-sky-700 mr-3 text-sm">Edit</button>
                    {!isUnitAdmin ? <button onClick={() => handleDelete(unit.id)} className="text-rose-600 hover:text-rose-700 text-sm">Hapus</button> : null}
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
