import { unitUrl } from "./unit-sites";

export function newsPath(unitSlug: string | null | undefined, newsSlug: string): string {
  return unitSlug ? unitUrl(unitSlug, `/berita/${newsSlug}`) : `/berita/${newsSlug}`;
}