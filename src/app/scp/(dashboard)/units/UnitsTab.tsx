"use client";

import { getErrorMessage } from "@/lib/get-error-message";
import { useState } from "react";
import { Unit } from "./UnitsManager";
import { toast } from "sonner";

const PNG_UPLOADS: Record<string, number> = { og_image: 1200 };

const inputClass = "min-w-0 w-full min-h-11 rounded border border-slate-300 p-2 text-[16px] focus:ring-2 focus:ring-primary-500 md:text-sm";
const labelClass = "mb-1 block text-sm font-medium";
const btnSecondary = "inline-flex min-h-11 items-center justify-center rounded border px-4 text-slate-600 hover:bg-slate-50";
const btnPrimary = "inline-flex min-h-11 items-center justify-center rounded bg-primary-600 px-4 text-white hover:bg-primary-700 disabled:opacity-50";

function Section({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
      <legend className="text-base font-semibold text-slate-900">{legend}</legend>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 [&>div]:min-w-0">{children}</div>
    </fieldset>
  );
}

function ImageInput({
  id,
  label,
  hint,
  value,
  previewClass,
  onChange,
  onRemove,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  previewClass: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="md:col-span-2">
      <span className={labelClass}>{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input type="text" aria-label={`URL ${label}`} value={value} readOnly placeholder="Belum ada file" className={`${inputClass} bg-slate-50`} />
        <input id={id} aria-label={label} type="file" accept="image/*" onChange={onChange} className="peer sr-only" />
        <label htmlFor={id} className={`${btnSecondary} cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500`}>Pilih gambar</label>
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
      {value ? (
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <img src={value} alt={`Pratinjau ${label}`} className={previewClass} />
          <button type="button" onClick={onRemove} className="inline-flex min-h-11 items-center rounded px-3 text-sm text-rose-600 hover:bg-rose-50">Hapus</button>
        </div>
      ) : null}
    </div>
  );
}

export function UnitsTab({ units, refresh, userRole }: { units: Unit[], refresh: () => void, userRole?: string }) {
  const isUnitAdmin = userRole === 'admin_unit';
  const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const input = e.currentTarget;
    const unitId = editingUnit?.id;
    setUploads((current) => current + 1);

    const uploadData = new FormData();
    uploadData.append("file", file);
    if (PNG_UPLOADS[fieldName]) {
      uploadData.append("format", "png");
      uploadData.append("max", String(PNG_UPLOADS[fieldName]));
    }

    const toastId = toast.loading("Mengunggah...");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload");

      setEditingUnit(prev => prev && prev.id === unitId ? { ...prev, [fieldName]: data.url } : prev);
      toast.success("Berhasil diunggah", { id: toastId });
    } catch (err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
    } finally {
      input.value = "";
      setUploads((current) => current - 1);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploads > 0 || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan...");
    try {
      const url = editingUnit?.id ? `/api/admin/units/${editingUnit.id}` : `/api/admin/units`;
      const method = editingUnit?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingUnit, og_image: editingUnit?.og_image || null })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : "Pengaturan unit belum dapat disimpan. Coba lagi beberapa saat. Jika tetap gagal, hubungi administrator server.";
        const displayedError = `${message}${typeof data.code === "string" ? ` (Kode: ${data.code})` : ""}`;
        setSaveError(displayedError);
        if (res.status === 409) {
          toast.error(displayedError, {
            id: toastId,
            action: { label: "Muat ulang", onClick: () => {
              if (confirm("Muat ulang akan mengganti isian yang belum disimpan dengan data terbaru. Lanjutkan?")) {
                refresh(); setEditingUnit(null); setSaveError(null);
              }
            } },
          });
          return;
        }
        toast.error(displayedError, { id: toastId });
        return;
      }
      toast.success("Tersimpan!", { id: toastId });
      setEditingUnit(null);
      refresh();
    } catch {
      const message = "Tidak dapat menghubungi server. Periksa koneksi internet, lalu coba simpan lagi. Jika sebelumnya sudah menekan Simpan, periksa data terbaru sebelum mengulang.";
      setSaveError(message);
      toast.error(message, { id: toastId });
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
    } catch (err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
    }
  };

  if (editingUnit !== null) {
    return (
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold">{editingUnit.id ? "Edit Unit" : "Tambah Unit Baru"}</h3>
          <button type="button" onClick={() => setEditingUnit(null)} className={btnSecondary}>Kembali ke Daftar</button>
        </div>

        {saveError ? (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <p className="font-semibold">Pengaturan unit belum berhasil disimpan</p>
            <p className="mt-1 break-words">{saveError}</p>
            <p className="mt-2">Isian Anda masih ada di form ini. Jangan tutup halaman sebelum mencatat atau menyalin perubahan.</p>
          </div>
        ) : null}

        <Section legend="Identitas Unit">
          <div>
            <label className={labelClass}>Nama Unit *</label>
            <input type="text" value={editingUnit.name || ""} onChange={e => setEditingUnit({ ...editingUnit, name: e.target.value })} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Slug (URL) *</label>
            <input type="text" value={editingUnit.slug || ""} onChange={e => setEditingUnit({ ...editingUnit, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} readOnly={isUnitAdmin} className={`${inputClass} ${isUnitAdmin ? 'bg-slate-50' : ''}`} required />
          </div>
          <div>
            <label className={labelClass}>Tagline</label>
            <input type="text" value={editingUnit.tagline || ""} onChange={e => setEditingUnit({ ...editingUnit, tagline: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Deskripsi Singkat</label>
            <input type="text" value={editingUnit.description || ""} onChange={e => setEditingUnit({ ...editingUnit, description: e.target.value })} className={inputClass} />
          </div>
          <ImageInput id="logo_url" label="Logo Unit" hint="PNG transparan, 200 x 80 px." value={editingUnit.logo_url || ""} previewClass="h-14 w-auto max-w-[160px] object-contain" onChange={(e) => handleUpload(e, "logo_url")} onRemove={() => setEditingUnit({ ...editingUnit, logo_url: "" })} />
          <ImageInput id="og_image" label="Gambar Pratinjau Tautan (OG)" hint="1200 x 630 px, PNG." value={editingUnit.og_image || ""} previewClass="h-16 w-full max-w-[200px] rounded object-cover aspect-[1200/630]" onChange={(e) => handleUpload(e, "og_image")} onRemove={() => setEditingUnit({ ...editingUnit, og_image: "" })} />
        </Section>

        <Section legend="Tentang Kami">
          <ImageInput id="profile_image" label="Foto Profil Unit" hint="Rasio 1:1, foto gedung atau kegiatan." value={editingUnit.profile_image || ""} previewClass="h-20 w-20 rounded object-cover" onChange={(e) => handleUpload(e, "profile_image")} onRemove={() => setEditingUnit({ ...editingUnit, profile_image: "" })} />
          <div>
            <label className={labelClass}>Jumlah Siswa</label>
            <input type="text" value={editingUnit.stat_students || ""} onChange={e => setEditingUnit({ ...editingUnit, stat_students: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tahun Berdiri</label>
            <input type="text" value={editingUnit.stat_founded || ""} onChange={e => setEditingUnit({ ...editingUnit, stat_founded: e.target.value })} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Sejarah Unit (HTML)</label>
            <textarea value={editingUnit.history_html || ""} onChange={e => setEditingUnit({ ...editingUnit, history_html: e.target.value })} rows={4} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Deskripsi Lengkap (HTML/Teks)</label>
            <textarea value={editingUnit.content || ""} onChange={e => setEditingUnit({ ...editingUnit, content: e.target.value })} rows={5} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Visi</label>
            <input type="text" value={editingUnit.vision || ""} onChange={e => setEditingUnit({ ...editingUnit, vision: e.target.value })} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Misi (satu per baris)</label>
            <textarea value={editingUnit.mission || ""} onChange={e => setEditingUnit({ ...editingUnit, mission: e.target.value })} rows={4} className={inputClass} />
          </div>
        </Section>

        <Section legend="Hero">
          <div>
            <label className={labelClass}>Judul Hero</label>
            <input type="text" maxLength={120} value={editingUnit.hero_title || ""} onChange={e => setEditingUnit({ ...editingUnit, hero_title: e.target.value })} placeholder="Kosongkan untuk memakai tagline" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Subjudul Hero</label>
            <input type="text" maxLength={300} value={editingUnit.hero_subtitle || ""} onChange={e => setEditingUnit({ ...editingUnit, hero_subtitle: e.target.value })} placeholder="Kosongkan untuk memakai deskripsi" className={inputClass} />
          </div>
          <ImageInput id="image_url" label="Foto Utama (Hero)" hint="Optimal 1200 x 800 px, rasio 3:2." value={editingUnit.image_url || ""} previewClass="h-20 w-full max-w-[200px] rounded object-cover" onChange={(e) => handleUpload(e, "image_url")} onRemove={() => setEditingUnit({ ...editingUnit, image_url: "" })} />
          <ImageInput id="hero_background" label="Background Hero" hint="Opsional, 1920 x 1080 px." value={editingUnit.hero_background || ""} previewClass="h-16 w-full max-w-[200px] rounded object-cover" onChange={(e) => handleUpload(e, "hero_background")} onRemove={() => setEditingUnit({ ...editingUnit, hero_background: "" })} />
          <ImageInput id="programs_background" label="Background Program" hint="Opsional, 1920 x 1080 px." value={editingUnit.programs_background || ""} previewClass="h-16 w-full max-w-[200px] rounded object-cover" onChange={(e) => handleUpload(e, "programs_background")} onRemove={() => setEditingUnit({ ...editingUnit, programs_background: "" })} />
        </Section>

        <Section legend="Kontak & Sosial Media">
          <div className="md:col-span-2">
            <label className={labelClass}>Alamat Unit</label>
            <input type="text" value={editingUnit.address || ""} onChange={e => setEditingUnit({ ...editingUnit, address: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telepon Unit</label>
            <input type="text" value={editingUnit.phone || ""} onChange={e => setEditingUnit({ ...editingUnit, phone: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email Unit</label>
            <input type="email" value={editingUnit.contact_email || ""} onChange={e => setEditingUnit({ ...editingUnit, contact_email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Instagram</label>
            <input type="text" value={editingUnit.social_instagram || ""} onChange={e => setEditingUnit({ ...editingUnit, social_instagram: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Facebook</label>
            <input type="text" value={editingUnit.social_facebook || ""} onChange={e => setEditingUnit({ ...editingUnit, social_facebook: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>YouTube</label>
            <input type="text" value={editingUnit.social_youtube || ""} onChange={e => setEditingUnit({ ...editingUnit, social_youtube: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Link Peta (Embed)</label>
            <input type="text" value={editingUnit.map_embed_url || ""} onChange={e => setEditingUnit({ ...editingUnit, map_embed_url: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Koordinat Peta</label>
            <input type="text" value={editingUnit.map_coordinates || ""} onChange={e => setEditingUnit({ ...editingUnit, map_coordinates: e.target.value })} placeholder="lat,long" className={inputClass} />
          </div>
        </Section>

        <Section legend="WhatsApp">
          <div>
            <label className={labelClass}>Nomor WhatsApp</label>
            <input type="text" value={editingUnit.wa_number || ""} onChange={e => setEditingUnit({ ...editingUnit, wa_number: e.target.value })} placeholder="Contoh: 628123456789" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pesan Default</label>
            <input type="text" value={editingUnit.wa_message || ""} onChange={e => setEditingUnit({ ...editingUnit, wa_message: e.target.value })} placeholder="Halo, saya ingin bertanya." className={inputClass} />
          </div>
        </Section>

        <Section legend="Pengaturan">
          <div>
            <label className={labelClass}>Warna Utama</label>
            <input type="color" value={editingUnit.primary_color || "#14532d"} onChange={e => setEditingUnit({ ...editingUnit, primary_color: e.target.value.toLowerCase() })} className="h-11 w-full rounded border p-1" />
          </div>
          <div>
            <label className={labelClass}>Warna Aksen</label>
            <input type="color" value={editingUnit.secondary_color || "#fef08a"} onChange={e => setEditingUnit({ ...editingUnit, secondary_color: e.target.value.toLowerCase() })} className="h-11 w-full rounded border p-1" />
          </div>
          <div>
            <label className={labelClass}>Urutan Tampil</label>
            <input type="number" value={editingUnit.order_index || 0} onChange={e => setEditingUnit({ ...editingUnit, order_index: parseInt(e.target.value) || 0 })} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={editingUnit.status || 'active'} onChange={e => setEditingUnit({ ...editingUnit, status: e.target.value })} className={inputClass}>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </Section>

        <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-slate-200 bg-white pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setEditingUnit(null)} className={btnSecondary}>Batal</button>
          <button type="submit" disabled={isSaving || uploads > 0} className={btnPrimary}>{uploads > 0 ? "Mengunggah..." : isSaving ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold">Daftar Unit Sekolah</h3>
        {!isUnitAdmin ? (
          <button onClick={() => setEditingUnit({})} className={btnPrimary}>+ Tambah Unit</button>
        ) : null}
      </div>

      {units.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          {isUnitAdmin ? "Akun Anda belum terhubung ke unit. Hubungi admin yayasan." : "Belum ada unit. Klik + Tambah Unit untuk memulai."}
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {units.map(unit => (
              <div key={unit.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{unit.name}</p>
                    <p className="break-all text-xs text-slate-500">{unit.slug}</p>
                  </div>
                  <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${unit.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {unit.status === 'active' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => setEditingUnit(unit)} className={`${btnSecondary} text-sky-700`}>Edit</button>
                  {!isUnitAdmin ? <button onClick={() => handleDelete(unit.id)} className={`${btnSecondary} text-rose-600`}>Hapus</button> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-sm text-slate-500">
                  <th className="p-3">Nama Unit</th>
                  <th className="p-3">Urutan</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {units.map(unit => (
                  <tr key={unit.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{unit.name}</td>
                    <td className="p-3">{unit.order_index}</td>
                    <td className="p-3 text-slate-500">{unit.slug}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${unit.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {unit.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => setEditingUnit(unit)} className="mr-3 inline-flex min-h-11 items-center text-sm text-sky-600 hover:text-sky-700">Edit</button>
                      {!isUnitAdmin ? <button onClick={() => handleDelete(unit.id)} className="inline-flex min-h-11 items-center text-sm text-rose-600 hover:text-rose-700">Hapus</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
