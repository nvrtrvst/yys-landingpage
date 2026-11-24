import type { MetadataRoute } from "next";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { UNIT_SLUGS, foundationUrl } from "@/lib/unit-sites";

export const revalidate = 3600;

async function safeQuery(sql: string): Promise<RowDataPacket[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(sql);
    return rows;
  } catch (error) {
    console.error("Sitemap: query failed", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = foundationUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/berita`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/agenda`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/ppdb`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  for (const slug of UNIT_SLUGS) {
    entries.push({ url: `${base}/${slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
    entries.push({ url: `${base}/${slug}/berita`, lastModified: now, changeFrequency: "daily", priority: 0.6 });
    entries.push({ url: `${base}/${slug}/agenda`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
    entries.push({ url: `${base}/${slug}/galeri`, lastModified: now, changeFrequency: "monthly", priority: 0.5 });
  }

  const [units, news] = await Promise.all([
    safeQuery("SELECT slug FROM units WHERE status = 'active'"),
    safeQuery("SELECT slug, unit_id, published_at FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT 500"),
  ]);

  const unitSlugs = new Map<number, string>();
  for (const row of units) unitSlugs.set(Number(row.id), String(row.slug));

  for (const row of news) {
    const slug = String(row.slug);
    const unitSlug = row.unit_id ? unitSlugs.get(Number(row.unit_id)) : undefined;
    const url = unitSlug ? `${base}/${unitSlug}/berita/${slug}` : `${base}/berita/${slug}`;
    const lastModified = row.published_at ? new Date(String(row.published_at)) : now;
    entries.push({ url, lastModified, changeFrequency: "monthly", priority: 0.6 });
  }

  return entries;
}