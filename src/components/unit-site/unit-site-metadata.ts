import type { Metadata } from "next";
import { getUnitNewsDetail, getUnitSiteData, getUnitSiteUnit } from "./unit-site-data";
import { foundationUrl } from "@/lib/unit-sites";
import { getSettings } from "@/lib/db";

function plainText(html: string | null | undefined): string {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function realImage(url: string | null | undefined): string | null {
  return url && !url.startsWith("/uploads/dummy/") ? url : null;
}

async function foundationImages(): Promise<{ url: string; alt: string }[]> {
  const settings = await getSettings();
  const image = realImage(settings.og_image) || realImage(settings.site_logo);
  return image ? [{ url: image, alt: settings.site_name || "Yayasan Nuurul Muttaqiin" }] : [];
}

export async function generateUnitSiteMetadata(slug: string): Promise<Metadata> {
  const data = await getUnitSiteData(slug).catch(() => null);
  if (!data) return { robots: { index: false, follow: true } };

  const { unit } = data;
  const description = (unit.hero_subtitle || unit.description || (unit.tagline ? `${unit.name} — ${unit.tagline}` : `Informasi ${unit.name} di Yayasan Nuurul Muttaqiin.`)).slice(0, 160);
  const image = realImage(unit.og_image) || realImage(unit.image_url);
  const images = image ? [{ url: image, alt: unit.name }] : await foundationImages();
  const url = `${foundationUrl()}/${slug}`;

  return {
    title: { absolute: unit.name },
    description,
    alternates: { canonical: url },
    robots: unit.id ? undefined : { index: false, follow: true },
    openGraph: { type: "website", title: unit.name, description, url, images },
    twitter: { card: "summary_large_image", title: unit.name, description, images: images.map((item) => item.url) },
  };
}

export async function generateUnitNewsMetadata(newsSlug: string, unitSlug: string): Promise<Metadata> {
  const data = await getUnitNewsDetail(newsSlug, unitSlug).catch(() => null);
  if (!data) return {};

  const { unit, news } = data;
  const description = plainText(news.content).slice(0, 160) || `${news.title} di ${unit.name}.`;
  const image = realImage(news.image_url);
  const images = image ? [{ url: image, alt: news.title }] : await foundationImages();
  const url = `${foundationUrl()}/${unitSlug}/berita/${news.slug}`;
  const published = news.published_at || news.created_at || undefined;

  return {
    title: { absolute: news.title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: news.title,
      description,
      url,
      images,
      publishedTime: published,
      modifiedTime: news.created_at || published,
    },
    twitter: { card: "summary_large_image", title: news.title, description, images: images.map((item) => item.url) },
  };
}

export async function generateUnitListingMetadata(slug: string, kind: "berita" | "agenda" | "galeri", page = 1): Promise<Metadata> {
  const unit = await getUnitSiteUnit(slug).catch(() => null);
  if (!unit) return {};
  const labels = { berita: "Berita", agenda: "Agenda", galeri: "Galeri" };
  const title = `${labels[kind]} ${unit.name}`;
  const description = (unit.description || `Informasi ${kind} di ${unit.name}.`).slice(0, 160);
  const url = `${foundationUrl()}/${slug}/${kind}`;
  const images = await foundationImages();

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: page > 1 ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", title, description, url, images },
  };
}
