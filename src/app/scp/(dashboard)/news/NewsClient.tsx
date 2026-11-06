"use client";

import { getErrorMessage } from "@/lib/get-error-message";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type News = { id: number, title: string, slug: string, content: string, image_url: string, category: string, status: string, published_at: string, created_at: string };

export function NewsClient() {
  const [data, setData] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<News> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/news');
      if (!res.ok) throw new Error("Gagal memuat");
      setData(await res.json());
    } catch (err) {
      toast.error("Gagal memuat berita");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/news');
        if (!res.ok) throw new Error("Gagal memuat");
        if (!cancelled) setData(await res.json());
      } catch (err) {
        toast.error("Gagal memuat berita");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);
    const toastId = toast.loading("Mengunggah...");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Gagal upload");
      setEditingItem(prev => ({ ...prev, image_url: resData.url }));
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
      const url = editingItem?.id ? `/api/admin/news/${editingItem.id}` : `/api/admin/news`;
      const method = editingItem?.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem)
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Gagal menyimpan");
      toast.success("Tersimpan!", { id: toastId });
      setEditingItem(null);
      fetchData();
    } catch(err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus berita ini?")) return;
    const toastId = toast.loading("Menghapus...");
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Dihapus!", { id: toastId });
      fetchData();
    } catch(err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
    }
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  if (editingItem !== null) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">{editingItem.id ? "Edit Berita" : "Tulis Berita Baru"}</h3>
            <button type="button" onClick={() => setEditingItem(null)} className="text-slate-500 hover:text-slate-700 font-medium">&larr; Kembali</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Judul Berita *</label>
              <input type="text" value={editingItem.title || ""} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-100 text-lg font-semibold" required />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Slug (URL) *</label>
              <input type="text" value={editingItem.slug || ""} onChange={e => setEditingItem({...editingItem, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-100" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kategori / Tag</label>
              <input type="text" value={editingItem.category || ""} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-100" placeholder="Misal: Prestasi, Kegiatan" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Gambar Cover (URL)</label>
              <div className="flex gap-2 items-center">
                <input type="text" value={editingItem.image_url || ""} onChange={e => setEditingItem({...editingItem, image_url: e.target.value})} className="w-full border rounded p-2 bg-slate-50" readOnly />
                <input type="file" accept="image/*" onChange={handleUpload} className="text-sm" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Optimal: 800 x 600 px (Rasio 4:3)</p>
              {editingItem.image_url && <img src={editingItem.image_url} alt="Cover" className="mt-2 h-32 object-cover rounded" />}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Konten Berita</label>
              <RichTextEditor value={editingItem.content || ""} onChange={content => setEditingItem({...editingItem, content})} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status Publikasi</label>
              <select value={editingItem.status || 'draft'} onChange={e => setEditingItem({...editingItem, status: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-100 font-semibold">
                <option value="draft">Draft (Simpan Sementara)</option>
                <option value="published">Publish (Tampilkan di Web)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-8">
            <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium">Batal</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold disabled:opacity-50 flex items-center gap-2">
              {isSaving ? "Menyimpan..." : "Simpan Berita"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-slate-700 mb-1">Cari Judul</label>
            <input 
              type="text" 
              placeholder="Ketik judul..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-100">
              <option value="">Semua Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <button onClick={() => setEditingItem({ status: 'draft' })} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
          + Tulis Berita
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b">
                <th className="p-4 w-24">Cover</th>
                <th className="p-4">Judul Berita</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Status</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tidak ada berita.</td></tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <div className="w-16 h-12 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                        {row.image_url ? <img src={row.image_url} alt={row.title} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">No Img</span>}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-900">{row.title}</td>
                    <td className="p-4 text-sm text-slate-600">{row.category || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => setEditingItem(row)} className="text-sky-600 hover:text-sky-700 text-sm font-medium px-3 py-2 mr-2">Edit</button>
                      <button onClick={() => handleDelete(row.id)} className="text-rose-600 hover:text-rose-700 text-sm font-medium px-3 py-2">Hapus</button>
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
