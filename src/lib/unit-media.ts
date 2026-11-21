export function parseCarouselImages(value: unknown): string[] {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item) || item.startsWith("/uploads/"))
    .slice(0, 8);
}

export function youtubeEmbedUrl(value: string | null | undefined): string | null {
  const id = youtubeId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function youtubeWatchUrl(value: string | null | undefined): string | null {
  const id = youtubeId(value);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

function youtubeId(value: string | null | undefined): string | null {
  if (!value) return null;
  const input = value.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/i,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function safeMapEmbedUrl(value: string | null | undefined, address: string | null | undefined): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw) {
    const extracted = raw.match(/src=["']([^"']+)["']/i)?.[1] || raw;
    try {
      const url = new URL(extracted);
      const host = url.hostname.replace(/^www\./, "");
      if (url.protocol === "https:" && ["maps.google.com", "google.com", "maps.app.goo.gl", "goo.gl"].includes(host) && url.pathname.includes("maps")) {
        return url.toString();
      }
    } catch {
      return null;
    }
  }
  const query = address?.trim();
  if (!query) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}
