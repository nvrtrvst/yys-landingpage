import type { Metadata } from "next";
import { getUnitSiteData } from "./unit-site-data";

export async function generateUnitSiteMetadata(slug: string): Promise<Metadata> {
  const data = await getUnitSiteData(slug).catch(() => null);
  if (!data) return {};

  const { unit } = data;
  const title = unit.name;
  const description = unit.description || (unit.tagline ? `${unit.name} — ${unit.tagline}` : `Informasi ${unit.name} di Yayasan Nuurul Muttaqiin.`);
  const image = unit.image_url && !unit.image_url.startsWith("/uploads/dummy/")
    ? [{ url: unit.image_url, alt: unit.name }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: { title, description, url: `/${slug}`, images: image },
    twitter: { card: "summary_large_image", title, description, images: image?.map((item) => item.url) },
  };
}
