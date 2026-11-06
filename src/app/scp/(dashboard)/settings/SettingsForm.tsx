"use client";

import { getErrorMessage } from "@/lib/get-error-message";
import { useState } from "react";
import { toast } from "sonner";
import { btnGhostDanger, btnPrimary, btnSecondary, inputClass, textareaClass } from "@/components/scp/ui";

const readOnlyInputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function ImageField({
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
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input id={id} type="text" value={value} readOnly className={readOnlyInputClass} placeholder="Belum ada file" />
        <input id={`${id}-file`} type="file" accept="image/*" onChange={onChange} className="peer sr-only" />
        <label
          htmlFor={`${id}-file`}
          className={`${btnSecondary} cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2`}
        >
          Pilih gambar
        </label>
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
      {value ? (
        <div className="mt-3 flex items-end gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <img src={value} alt={`Pratinjau ${label}`} className={previewClass} />
          <button type="button" onClick={onRemove} className={btnGhostDanger} aria-label={`Hapus ${label}`}>
            Hapus
          </button>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
          Belum ada gambar.
        </p>
      )}
    </div>
  );
}

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
    social_instagram: initialData.social_instagram || initialData.instagram_url || "",
    social_facebook: initialData.social_facebook || initialData.facebook_url || "",
    social_youtube: initialData.social_youtube || initialData.youtube_url || "",
    wa_number: initialData.wa_number || initialData.whatsapp_number || "",
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
      toast.error((getErrorMessage(err)), { id: toastId });
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
      toast.error((getErrorMessage(err)), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
      <Section title="Identitas Yayasan" description="Nama, tagline, dan logo yang tampil di website.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field id="site_name" label="Nama Yayasan">
            <input id="site_name" type="text" name="site_name" value={formData.site_name} onChange={handleChange} className={inputClass} required />
          </Field>
          <Field id="site_tagline" label="Tagline">
            <input id="site_tagline" type="text" name="site_tagline" value={formData.site_tagline} onChange={handleChange} className={inputClass} />
          </Field>
          <div className="md:col-span-2">
            <ImageField
              id="site_logo"
              label="Logo Yayasan"
              hint="Optimal 200 x 80 px, PNG transparan."
              value={formData.site_logo}
              previewClass="h-16 w-auto object-contain"
              onChange={(e) => handleFileUpload(e, "site_logo")}
              onRemove={() => handleRemoveImage("site_logo")}
            />
          </div>
        </div>
      </Section>

      <Section title="Tentang Kami" description="Sejarah, visi, dan misi yang tampil di halaman profil.">
        <div className="space-y-5">
          <ImageField
            id="profile_image"
            label="Foto Gedung / Sejarah"
            hint="Optimal 600 x 600 px, rasio 1:1."
            value={formData.profile_image}
            previewClass="h-24 w-24 rounded object-cover"
            onChange={(e) => handleFileUpload(e, "profile_image")}
            onRemove={() => handleRemoveImage("profile_image")}
          />
          <Field id="profile_history" label="Sejarah Yayasan" hint="Mendukung HTML dasar dan disanitasi otomatis.">
            <textarea id="profile_history" name="profile_history" value={formData.profile_history} onChange={handleChange} rows={6} className={textareaClass} placeholder="Ceritakan sejarah berdirinya yayasan..." />
          </Field>
          <Field id="profile_vision" label="Visi">
            <textarea id="profile_vision" name="profile_vision" value={formData.profile_vision} onChange={handleChange} rows={3} className={textareaClass} placeholder="Visi yayasan..." />
          </Field>
          <Field id="profile_mission" label="Misi">
            <textarea id="profile_mission" name="profile_mission" value={formData.profile_mission} onChange={handleChange} rows={4} className={textareaClass} placeholder="Misi yayasan..." />
          </Field>
        </div>
      </Section>

      <Section title="Hero Section" description="Konten utama di bagian atas landing page.">
        <div className="space-y-5">
          <Field id="hero_title" label="Judul Hero">
            <input id="hero_title" type="text" name="hero_title" value={formData.hero_title} onChange={handleChange} className={inputClass} />
          </Field>
          <Field id="hero_subtitle" label="Subjudul Hero">
            <textarea id="hero_subtitle" name="hero_subtitle" value={formData.hero_subtitle} onChange={handleChange} rows={2} className={textareaClass} />
          </Field>
          <ImageField
            id="hero_background"
            label="Background Hero"
            hint="Optimal 1920 x 1080 px, rasio 16:9."
            value={formData.hero_background}
            previewClass="h-24 w-full max-w-xs rounded object-cover"
            onChange={(e) => handleFileUpload(e, "hero_background")}
            onRemove={() => handleRemoveImage("hero_background")}
          />
          <ImageField
            id="programs_background"
            label="Background Program Unggulan"
            hint="Optimal 1920 x 1080 px, rasio 16:9."
            value={formData.programs_background}
            previewClass="h-24 w-full max-w-xs rounded object-cover"
            onChange={(e) => handleFileUpload(e, "programs_background")}
            onRemove={() => handleRemoveImage("programs_background")}
          />
        </div>
      </Section>

      <Section title="Kontak & Sosial Media" description="Informasi kontak dan tautan sosial yang tampil di footer.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field id="contact_address" label="Alamat Lengkap">
              <textarea id="contact_address" name="contact_address" value={formData.contact_address} onChange={handleChange} rows={2} className={textareaClass} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field
              id="map_embed_url"
              label="URL Embed Google Maps"
              hint="Tempel URL embed (…/maps/embed…) agar peta tampil. Short link maps.app.goo.gl tetap dipakai untuk tombol buka Maps."
            >
              <textarea
                id="map_embed_url"
                name="map_embed_url"
                value={formData.map_embed_url}
                onChange={handleChange}
                rows={3}
                placeholder="https://www.google.com/maps/embed?pb=..."
                className={`${textareaClass} font-mono`}
              />
            </Field>
          </div>
          <Field id="contact_phone" label="Telepon">
            <input id="contact_phone" type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className={inputClass} />
          </Field>
          <Field id="contact_email" label="Email">
            <input id="contact_email" type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className={inputClass} />
          </Field>
          <Field id="social_instagram" label="Link Instagram">
            <input id="social_instagram" type="text" name="social_instagram" value={formData.social_instagram} onChange={handleChange} className={inputClass} placeholder="https://instagram.com/..." />
          </Field>
          <Field id="social_facebook" label="Link Facebook">
            <input id="social_facebook" type="text" name="social_facebook" value={formData.social_facebook} onChange={handleChange} className={inputClass} placeholder="https://facebook.com/..." />
          </Field>
          <Field id="social_youtube" label="Link YouTube">
            <input id="social_youtube" type="text" name="social_youtube" value={formData.social_youtube} onChange={handleChange} className={inputClass} placeholder="https://youtube.com/..." />
          </Field>
        </div>
      </Section>

      <Section title="WhatsApp Widget" description="Tombol chat yang muncul di website.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field id="wa_number" label="Nomor WhatsApp" hint="Contoh: 62812...">
            <input id="wa_number" type="text" name="wa_number" value={formData.wa_number} onChange={handleChange} className={inputClass} />
          </Field>
          <Field id="wa_message" label="Pesan Default">
            <input id="wa_message" type="text" name="wa_message" value={formData.wa_message} onChange={handleChange} className={inputClass} />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-4 flex justify-end rounded-xl border border-slate-200 bg-white p-3">
        <button type="submit" disabled={isSaving} className={btnPrimary}>
          {isSaving ? "Menyimpan..." : "Simpan & Refresh Cache"}
        </button>
      </div>
    </form>
  );
}
