const PLACEHOLDER_TEXT = /\blorem ipsum\b|\bjudul berita\b/i;
const PLACEHOLDER_VALUES = new Set([
  "hero", "subhero", "sub hero", "sejarah", "deskripsi", "visi", "misi",
  "nama program", "deskripsi program", "nama pembuat testimoni", "peran / posisi",
]);

export function plainUnitText(value: string | null | undefined): string {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function isPlaceholderContent(value: string | null | undefined): boolean {
  const text = plainUnitText(value).toLowerCase();
  return !!text && (PLACEHOLDER_TEXT.test(text) || PLACEHOLDER_VALUES.has(text));
}

export function readyUnitText(value: string | null | undefined): string {
  return value && !isPlaceholderContent(value) ? value : "";
}

export function isPlaceholderGalleryTitle(value: string | null | undefined): boolean {
  const text = plainUnitText(value);
  return isPlaceholderContent(text) || /^wp\d+[-_].*wallpapers?$/i.test(text);
}

export function isReadyNews(title: string, content: string | null): boolean {
  const cleanTitle = plainUnitText(title);
  const cleanContent = plainUnitText(content);
  return cleanTitle.length >= 8 && cleanContent.length >= 20
    && !isPlaceholderContent(cleanTitle) && !isPlaceholderContent(cleanContent);
}

export function unitFieldWarnings(fields: Record<string, unknown>): string[] {
  const labels: Record<string, string> = {
    tagline: "Tagline", description: "Deskripsi singkat", hero_title: "Judul hero",
    hero_subtitle: "Subjudul hero", history_html: "Sejarah", content: "Deskripsi lengkap",
    vision: "Visi", mission: "Misi", address: "Alamat", phone: "Telepon",
  };
  const warnings = Object.entries(labels)
    .filter(([field]) => isPlaceholderContent(typeof fields[field] === "string" ? fields[field] : null))
    .map(([, label]) => `${label} masih berisi teks contoh.`);
  if (![fields.content, fields.history_html, fields.vision, fields.mission]
    .some((value) => !!readyUnitText(typeof value === "string" ? value : null))) {
    warnings.push("Profil unit belum memiliki deskripsi, sejarah, visi, atau misi yang siap tayang.");
  }
  if (![fields.hero_title, fields.tagline, fields.hero_subtitle, fields.description]
    .some((value) => !!readyUnitText(typeof value === "string" ? value : null))) {
    warnings.push("Hero belum memiliki pengantar sekolah yang siap tayang.");
  }
  return warnings;
}
