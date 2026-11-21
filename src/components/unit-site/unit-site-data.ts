import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface UnitSiteUnit extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  image_url: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  content: string | null;
  address: string | null;
  phone: string | null;
}

export interface UnitSiteNews extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  image_url: string | null;
  published_at: string | null;
  created_at: string | null;
}

export interface UnitSiteNewsDetail extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  image_url: string | null;
  published_at: string | null;
  created_at: string | null;
}

export interface UnitSiteEvent extends RowDataPacket {
  id: number;
  title: string;
  start_date: string;
}

export interface UnitSiteTestimonial extends RowDataPacket {
  id: number;
  author_name: string;
  role: string | null;
  content: string;
}

export interface UnitSiteGallery extends RowDataPacket {
  id: number;
  title: string | null;
  image_url: string | null;
}

export interface UnitSiteData {
  unit: UnitSiteUnit;
  news: UnitSiteNews[];
  events: UnitSiteEvent[];
  testimonials: UnitSiteTestimonial[];
  galleries: UnitSiteGallery[];
}

export interface UnitNewsDetailData {
  unit: UnitSiteUnit;
  news: UnitSiteNewsDetail;
}

export async function getUnitSiteUnit(slug: string): Promise<UnitSiteUnit | null> {
  const [rows] = await pool.execute<UnitSiteUnit[]>(
    `SELECT id, name, slug, description, tagline, image_url, logo_url, primary_color, secondary_color, content, address, phone
     FROM units WHERE slug = ? AND status = 'active'`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function getUnitSiteData(slug: string): Promise<UnitSiteData | null> {
  const unit = await getUnitSiteUnit(slug);
  if (!unit) return null;

  // One failing feed must not blank the others.
  const results = await Promise.allSettled([
    pool.execute<UnitSiteNews[]>(
      `SELECT id, title, slug, image_url, published_at, created_at
       FROM news WHERE status = 'published' AND unit_id = ?
       ORDER BY published_at DESC LIMIT 3`,
      [unit.id]
    ),
    pool.execute<UnitSiteEvent[]>(
      `SELECT id, title, start_date FROM events
       WHERE start_date >= CURRENT_DATE() AND unit_id = ?
       ORDER BY start_date ASC LIMIT 3`,
      [unit.id]
    ),
    pool.execute<UnitSiteTestimonial[]>(
      `SELECT id, author_name, role, content FROM testimonials
       WHERE is_active = 1 AND unit_id = ?
       ORDER BY order_index ASC LIMIT 1`,
      [unit.id]
    ),
    pool.execute<UnitSiteGallery[]>(
      `SELECT id, title, image_url FROM galleries
       WHERE unit_id = ? ORDER BY created_at DESC LIMIT 4`,
      [unit.id]
    ),
  ]);

  const news = results[0].status === "fulfilled" ? results[0].value[0] : [];
  const events = results[1].status === "fulfilled" ? results[1].value[0] : [];
  const testimonials = results[2].status === "fulfilled" ? results[2].value[0] : [];
  const galleries = results[3].status === "fulfilled" ? results[3].value[0] : [];
  results.forEach((result) => {
    if (result.status === "rejected") console.error("Failed to load unit site content", result.reason);
  });

  return { unit, news, events, testimonials, galleries };
}

export async function getUnitNewsDetail(newsSlug: string, unitSlug: string): Promise<UnitNewsDetailData | null> {
  const unit = await getUnitSiteUnit(unitSlug);
  if (!unit) return null;

  const [rows] = await pool.execute<UnitSiteNewsDetail[]>(
    `SELECT n.id, n.title, n.slug, n.content, n.image_url, n.published_at, n.created_at
     FROM news n
     JOIN units u ON u.id = n.unit_id
     WHERE n.slug = ? AND n.status = 'published' AND u.slug = ? AND u.status = 'active'`,
    [newsSlug, unitSlug]
  );
  const news = rows[0];
  if (!news) return null;

  return { unit, news };
}
