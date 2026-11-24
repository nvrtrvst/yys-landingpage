import type { Metadata } from "next";
import { getUnitNewsDetail, getUnitSiteData, getUnitSiteUnit } from "./unit-site-data";
import { foundationUrl } from "@/lib/unit-sites";

export async function generateUnitSiteMetadata(slug: string): Promise<Metadata> {
  const data = await getUnitSiteData(slug).catch(() => null);
  if (!data) return {};

  const { unit } = data;
  const title = unit.name;
  const description = unit.description || (unit.tagline ? `${unit.name} — ${unit.tagline}` : `Informasi ${unit.name} di Yayasan Nuurul Muttaqiin.`);
  const image = unit.image_url && !unit.image_url.startsWith("/uploads/dummy/")
    ? [{ url: unit.image_url, alt: unit.name }]
    : undefined;
  const url = `${foundationUrl()}/${slug}`;

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
  const url = `${foundationUrl()}/${unitSlug}/berita/${news.slug}`;

  return {
    title: news.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: news.title, description, url, images: image },
    twitter: { card: "summary_large_image", title: news.title, description, images: image?.map((item) => item.url) },
  };
}

export async function generateUnitListingMetadata(slug: string, kind: "berita" | "agenda" | "galeri"): Promise<Metadata> {
  const unit = await getUnitSiteUnit(slug).catch(() => null);
  if (!unit) return {};
  const labels = { berita: "Berita", agenda: "Agenda", galeri: "Galeri" };
  const title = `${labels[kind]} ${unit.name}`;
  const description = unit.description || `Informasi ${kind} di ${unit.name}.`;
  const url = `${foundationUrl()}/${slug}/${kind}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
}