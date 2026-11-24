export const UNIT_SLUGS = ["lpq", "tk", "sd", "smp", "smk"] as const;

export type UnitSlug = (typeof UNIT_SLUGS)[number];

export const UNIT_FALLBACK: Record<UnitSlug, { name: string; tagline: string }> = {
  lpq: { name: "LPQ Nuurul Muttaqiin", tagline: "Lembaga Pendidikan Qur'an" },
  tk: { name: "TK Nuurul Muttaqiin", tagline: "Taman Kanak-kanak Islam" },
  sd: { name: "SD Nuurul Muttaqiin", tagline: "Sekolah Dasar Islam" },
  smp: { name: "SMP Nuurul Muttaqiin", tagline: "Sekolah Menengah Pertama Islam" },
  smk: { name: "SMK Nuurul Muttaqiin", tagline: "Sekolah Menengah Kejuruan" },
};

const DEFAULT_ROOT_URL = "https://nuurulmuttaqiin.or.id";

function rootUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || DEFAULT_ROOT_URL);
  } catch {
    return new URL(DEFAULT_ROOT_URL);
  }
}

export function rootHost(): string {
  return rootUrl().hostname.replace(/^www\./, "").toLowerCase();
}

export function isKnownUnitSlug(value: string): value is UnitSlug {
  return (UNIT_SLUGS as readonly string[]).includes(value);
}

export function unitSlugFromHost(host: string, baseHost: string = rootHost()): UnitSlug | null {
  const hostname = host.split(":")[0].toLowerCase().replace(/\.$/, "");
  const suffix = `.${baseHost.toLowerCase()}`;
  if (!hostname.endsWith(suffix)) return null;
  const slug = hostname.slice(0, -suffix.length);
  return isKnownUnitSlug(slug) ? slug : null;
}

export function foundationUrl(): string {
  return rootUrl().toString().replace(/\/$/, "");
}

// ponytail: path-relative now; return the absolute unit-domain URL once units.custom_domain is populated.
export function unitUrl(slug: string, path = "/"): string {
  if (!path || path === "/") return `/${slug}`;
  return `/${slug}${path.startsWith("/") ? path : `/${path}`}`;
}

export function unitNewsUrl(slug: string, newsSlug: string): string {
  return unitUrl(slug, `/berita/${newsSlug}`);
}