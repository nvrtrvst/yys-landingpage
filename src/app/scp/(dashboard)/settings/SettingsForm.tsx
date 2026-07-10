"use client";
import { useState } from "react";
import { toast } from "sonner";

export function SettingsForm({ initialData }: { initialData: Record<string, string> }) {
  const [formData, setFormData] = useState<Record<string, string>>({
    site_name: initialData.site_name || "",
    site_tagline: initialData.site_tagline || "",
    site_logo: initialData.site_logo || "",
    hero_title: initialData.hero_title || "",
    hero_subtitle: initialData.hero_subtitle || "",
    hero_background: initialData.hero_background || "",
    profile_image: initialData.profile_image || "",
    profile_history: initialData.profile_history || "",
    profile_vision: initialData.profile_vision || "",
    profile_mission: initialData.profile_mission || "",
    stat_students: initialData.stat_students || "0",
    stat_founded: initialData.stat_founded || "2000",
    contact_address: initialData.contact_address || "",
    contact_phone: initialData.contact_phone || "",
    contact_email: initialData.contact_email || "",
    social_instagram: initialData.social_instagram || "",
    social_facebook: initialData.social_facebook || "",
    social_youtube: initialData.social_youtube || "",
    wa_number: initialData.wa_number || "",
    wa_message: initialData.wa_message || "",
    recaptcha_site: initialData.recaptcha_site || "",
    recaptcha_secret: initialData.recaptcha_secret || "",
    map_embed_url: initialData.map_embed_url || "",
    programs_background: initialData.programs_background || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    const toastId = toast.loading("Mengunggah file...");
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload");
      
      setFormData(prev => ({ ...prev, [fieldName]: data.url }));
      toast.success("File berhasil diunggah", { id: toastId });
    } catch(err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  };

  const handleRemoveImage = (fieldName: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan pengaturan...");
    
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.success("Pengaturan berhasil disimpan & landing page di-refresh!", { id: toastId });
    } catch(err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Identitas Website */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Identitas Yayasan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Yayasan</label>
            <input type="text" name="site_name" value={formData.site_name} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tagline</label>
            <input type="text" name="site_tagline" value={formData.site_tagline} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Logo URL</label>
            <div className="flex gap-2 items-center">
              <input type="text" name="site_logo" value={formData.site_logo} onChange={handleChange} className="w-full border rounded p-2 bg-gray-50" readOnly />
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "site_logo")} className="text-sm" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Optimal: 200 x 80 px (Transparan PNG)</p>
            {formData.site_logo && (
              <div className="mt-2 flex items-end gap-4">
                <img src={formData.site_logo} alt="Logo" className="h-16 object-contain" />
                <button type="button" onClick={() => handleRemoveImage("site_logo")} className="text-red-600 text-sm font-semibold hover:underline">Hapus Foto</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Tentang Kami */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Tentang Kami</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Foto Gedung/Sejarah</label>
            <div className="flex gap-2 items-center">
              <input type="text" name="profile_image" value={formData.profile_image} onChange={handleChange} className="w-full border rounded p-2 bg-gray-50" readOnly />
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "profile_image")} className="text-sm" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Optimal: 600 x 600 px (Persegi 1:1)</p>
            {formData.profile_image && (
              <div className="mt-2 flex items-end gap-4">
                <img src={formData.profile_image} alt="Profile" className="h-24 object-cover rounded" />
                <button type="button" onClick={() => handleRemoveImage("profile_image")} className="text-red-600 text-sm font-semibold hover:underline">Hapus Foto</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Hero Section */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Hero Section (Landing Page)</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Judul Hero</label>
            <input type="text" name="hero_title" value={formData.hero_title} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subjudul Hero</label>
            <textarea name="hero_subtitle" value={formData.hero_subtitle} onChange={handleChange} rows={2} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gambar Background URL (Hero)</label>
            <div className="flex gap-2 items-center">
              <input type="text" name="hero_background" value={formData.hero_background} onChange={handleChange} className="w-full border rounded p-2 bg-gray-50" readOnly />
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "hero_background")} className="text-sm" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Optimal: 1920 x 1080 px (Rasio 16:9)</p>
            {formData.hero_background && (
              <div className="mt-2 flex items-end gap-4">
                <img src={formData.hero_background} alt="Hero BG" className="h-24 object-cover rounded" />
                <button type="button" onClick={() => handleRemoveImage("hero_background")} className="text-red-600 text-sm font-semibold hover:underline">Hapus Foto</button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gambar Background Parallax (Program Unggulan)</label>
            <div className="flex gap-2 items-center">
              <input type="text" name="programs_background" value={formData.programs_background} onChange={handleChange} className="w-full border rounded p-2 bg-gray-50" readOnly />
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "programs_background")} className="text-sm" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Optimal: 1920 x 1080 px (Rasio 16:9)</p>
            {formData.programs_background && (
              <div className="mt-2 flex items-end gap-4">
                <img src={formData.programs_background} alt="Programs BG" className="h-24 object-cover rounded" />
                <button type="button" onClick={() => handleRemoveImage("programs_background")} className="text-red-600 text-sm font-semibold hover:underline">Hapus Foto</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Kontak & Sosmed */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Kontak & Sosial Media</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Alamat Lengkap</label>
            <textarea name="contact_address" value={formData.contact_address} onChange={handleChange} rows={2} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500"></textarea>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">URL Embed Google Maps</label>
            <textarea 
              name="map_embed_url" 
              value={formData.map_embed_url} 
              onChange={handleChange} 
              rows={3} 
              placeholder="https://www.google.com/maps/embed?pb=..."
              className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              Buka Google Maps, cari lokasi, klik Bagikan &gt; Sematkan peta (Embed a map), salin URL dari atribut src iframe (berawalan https://www.google.com/maps/embed...), lalu tempel di sini.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telepon</label>
            <input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link Instagram</label>
            <input type="text" name="social_instagram" value={formData.social_instagram} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link Facebook</label>
            <input type="text" name="social_facebook" value={formData.social_facebook} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link YouTube</label>
            <input type="text" name="social_youtube" value={formData.social_youtube} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
      </section>

      {/* 4. WhatsApp Widget */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">WhatsApp Widget</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Nomor WhatsApp (Contoh: 62812...)</label>
            <input type="text" name="wa_number" value={formData.wa_number} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pesan Default</label>
            <input type="text" name="wa_message" value={formData.wa_message} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end sticky bottom-6">
        <button 
          type="submit" 
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? "Menyimpan..." : "Simpan & Refresh Cache"}
        </button>
      </div>
    </form>
  );
}
