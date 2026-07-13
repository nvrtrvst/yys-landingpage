"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type GalleryItem = { id: number, title: string | null, image_url: string, created_at: string };

export function GalleryClient() {
  const [data, setData] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gallery');
      if (!res.ok) throw new Error("Gagal memuat");
      setData(await res.json());
    } catch (err) {
      toast.error("Gagal memuat galeri");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/gallery');
        if (!res.ok) throw new Error("Gagal memuat");
        if (!cancelled) setData(await res.json());
      } catch (err) {
        toast.error("Gagal memuat galeri");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    const toastId = toast.loading(`Mengunggah 0/${files.length} foto...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadData = new FormData();
      uploadData.append("file", file);
      
      try {
        toast.loading(`Mengunggah ${i+1}/${files.length} foto...`, { id: toastId });
        // 1. Upload to storage
        const resUpload = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
        const resUploadData = await resUpload.json();
        if (!resUpload.ok) throw new Error(resUploadData.error);
        
        // 2. Save to db
        const resDb = await fetch("/api/admin/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: resUploadData.url, title: file.name.split('.')[0] })
        });
        if (!resDb.ok) throw new Error("Gagal menyimpan ke database");
        
        successCount++;
      } catch(err: unknown) {
        toast.error(`Gagal mengunggah ${file.name}: ${(err instanceof Error ? err.message : String(err))}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Berhasil mengunggah ${successCount} foto!`, { id: toastId });
      fetchData();
    } else {
      toast.error("Semua unggahan gagal.", { id: toastId });
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus foto ini secara permanen? File fisik juga akan dihapus.")) return;
    const toastId = toast.loading("Menghapus...");
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Foto dihapus!", { id: toastId });
      fetchData();
    } catch(err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  };

  const handleUpdateTitle = async (id: number, title: string) => {
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error();
      toast.success("Keterangan disimpan");
    } catch (err) {
      toast.error("Gagal menyimpan keterangan");
    }
  };

  return (
    <div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold">Unggah Foto Baru</h3>
          <p className="text-sm text-gray-500">Pilih satu atau beberapa foto sekaligus. (Optimal: 1200x800 px, Rasio 3:2)</p>
        </div>
        <div className="relative">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <button disabled={isUploading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow flex items-center gap-2 disabled:opacity-50">
            {isUploading ? "Mengunggah..." : "+ Pilih Foto"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat galeri...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-500">
          Belum ada foto di galeri.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group relative">
              <div className="h-48 bg-gray-100 overflow-hidden relative">
                <img src={item.image_url} alt={item.title || 'Gallery'} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
                  title="Hapus Foto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
              </div>
              <div className="p-3">
                <input 
                  type="text" 
                  defaultValue={item.title || ""} 
                  placeholder="Keterangan foto (opsional)..."
                  onBlur={(e) => {
                    if (e.target.value !== item.title) {
                      handleUpdateTitle(item.id, e.target.value);
                      setData(prev => prev.map(it => it.id === item.id ? { ...it, title: e.target.value } : it));
                    }
                  }}
                  className="w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none p-1 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-2 px-1">
                  {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
