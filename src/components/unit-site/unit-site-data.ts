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

export async function getUnitSiteData(slug: string): Promise<UnitSiteData | null> {
  const [unitRows] = await pool.execute<UnitSiteUnit[]>(
    `SELECT id, name, slug, description, tagline, image_url, logo_url, primary_color, secondary_color, content, address, phone
     FROM units WHERE slug = ? AND status = 'active'`,
    [slug]
  );
  const unit = unitRows[0];
  if (!unit) return null;

  let news: UnitSiteNews[] = [];
  let events: UnitSiteEvent[] = [];
  let testimonials: UnitSiteTestimonial[] = [];
  let galleries: UnitSiteGallery[] = [];
  try {
    const [newsRows, eventRows, testimonialRows, galleryRows] = await Promise.all([
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
    news = newsRows[0];
    events = eventRows[0];
    testimonials = testimonialRows[0];
    galleries = galleryRows[0];
  } catch (error) {
    console.error("Failed to load unit site content", error);
  }

  return { unit, news, events, testimonials, galleries };
}
