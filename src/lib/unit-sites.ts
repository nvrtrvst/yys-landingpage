export const UNIT_SLUGS = ["lpq", "tk", "sd", "smp", "smk"] as const;

export type UnitSlug = (typeof UNIT_SLUGS)[number];

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

export function unitSlugFromHost(host: string, baseHost: string = rootHost()): UnitSlug | null {
  const hostname = host.split(":")[0].toLowerCase().replace(/\.$/, "");
  const suffix = `.${baseHost.toLowerCase()}`;
  if (!hostname.endsWith(suffix)) return null;
  const slug = hostname.slice(0, -suffix.length);
  return (UNIT_SLUGS as readonly string[]).includes(slug) ? (slug as UnitSlug) : null;
}

export function unitSiteOrigin(slug: string): string {
  const url = rootUrl();
  const host = url.hostname.replace(/^www\./, "");
  const port = url.port ? `:${url.port}` : "";
  return `${url.protocol}//${slug}.${host}${port}`;
}

export function foundationUrl(): string {
  return rootUrl().toString().replace(/\/$/, "");
}
