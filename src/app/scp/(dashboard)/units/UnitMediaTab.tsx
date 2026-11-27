"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/get-error-message";
import { parseCarouselImages, youtubeWatchUrl } from "@/lib/unit-media";
import type { Unit } from "./UnitsManager";

function UnitMediaForm({ unit, refresh }: { unit: Unit; refresh: () => void }) {
  const [images, setImages] = useState<string[]>(() => parseCarouselImages(unit.carousel_images));
  const [youtubeUrl, setYoutubeUrl] = useState(unit.youtube_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    const toastId = toast.loading(`Mengunggah ${files.length} gambar...`);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mengunggah");
        uploaded.push(data.url);
      }
      setImages((current) => [...current, ...uploaded].slice(0, 8));
      toast.success("Gambar ditambahkan", { id: toastId });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: toastId });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Menyimpan media...");
    try {
      const res = await fetch(`/api/admin/units/${unit.id}/media`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carousel_images: images, youtube_url: youtubeUrl || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.success("Media tersimpan", { id: toastId });
      refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const watchUrl = youtubeWatchUrl(youtubeUrl);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Periksa setiap gambar dan video sebelum disimpan. Hapus QR, wallpaper, rekaman layar, atau materi uji; gunakan dokumentasi kegiatan unit yang sudah disetujui.
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Gambar Carousel</label>
          <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading || images.length >= 8} className="block w-full text-sm" />
          <p className="text-xs text-slate-500 mt-1">Maksimal 8 gambar. Upload beberapa sekaligus.</p>
          {images.length ? (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {images.map((src, index) => (
                <div key={`${src}-${index}`} className="relative border rounded overflow-hidden">
                  <img src={src} alt={`Carousel ${index + 1}`} className="w-full h-24 object-cover" />
                  <button type="button" onClick={() => setImages((current) => current.filter((_, position) => position !== index))} className="absolute top-1 right-1 bg-white text-rose-600 text-xs px-2 py-1 rounded">Hapus</button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Video YouTube</label>
          <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full border rounded p-2" placeholder="https://youtube.com/watch?v=..." />
          {watchUrl ? <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-sky-700 mt-2">Cek video di YouTube</a> : null}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button type="submit" disabled={saving || uploading} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
          {saving ? "Menyimpan..." : "Simpan Media"}
        </button>
      </div>
    </form>
  );
}

export function UnitMediaTab({ units, refresh, userRole }: { units: Unit[], refresh: () => void, userRole?: string }) {
  const isUnitAdmin = userRole === "admin_unit";
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeId = selectedId && units.some((item) => item.id === selectedId) ? selectedId : units[0]?.id ?? null;
  const unit = units.find((item) => item.id === activeId) ?? units[0] ?? null;

  if (units.length === 0) return <p className="text-slate-500">Belum ada unit.</p>;
  if (!unit) return null;

  return (
    <div className="space-y-6">
      {!isUnitAdmin ? (
        <div>
          <label className="block text-sm font-medium mb-1">Unit</label>
          <select value={activeId ?? ""} onChange={(e) => setSelectedId(Number(e.target.value))} className="w-full border rounded p-2">
            {units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      ) : null}
      <UnitMediaForm key={unit.id} unit={unit} refresh={refresh} />
    </div>
  );
}
