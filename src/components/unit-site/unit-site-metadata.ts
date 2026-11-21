import type { Metadata } from "next";
import { getUnitNewsDetail, getUnitSiteData } from "./unit-site-data";
import { unitSiteOrigin } from "@/lib/unit-sites";

export async function generateUnitSiteMetadata(slug: string): Promise<Metadata> {
  const data = await getUnitSiteData(slug).catch(() => null);
  if (!data) return {};

  const { unit } = data;
  const title = unit.name;
  const description = unit.description || (unit.tagline ? `${unit.name} — ${unit.tagline}` : `Informasi ${unit.name} di Yayasan Nuurul Muttaqiin.`);
  const image = unit.image_url && !unit.image_url.startsWith("/uploads/dummy/")
    ? [{ url: unit.image_url, alt: unit.name }]
    : undefined;
  const url = `${unitSiteOrigin(slug)}/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: image },
    twitter: { card: "summary_large_image", title, description, images: image?.map((item) => item.url) },
  };
}

export async function generateUnitNewsMetadata(newsSlug: string, unitSlug: string): Promise<Metadata> {
  const data = await getUnitNewsDetail(newsSlug, unitSlug).catch(() => null);
  if (!data) return {};

  const { unit, news } = data;
  const description = (news.content || "").replace(/<[^>]*>/g, "").trim().slice(0, 160) || `${news.title} di ${unit.name}.`;
  const image = news.image_url && !news.image_url.startsWith("/uploads/dummy/")
    ? [{ url: news.image_url, alt: news.title }]
    : undefined;
  const url = `${unitSiteOrigin(unitSlug)}/${unitSlug}/berita/${news.slug}`;

  return {
    title: news.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: news.title, description, url, images: image },
    twitter: { card: "summary_large_image", title: news.title, description, images: image?.map((item) => item.url) },
  };
}
