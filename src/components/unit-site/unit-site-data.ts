import pool, { getSettings } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { isKnownUnitSlug, UNIT_FALLBACK } from "@/lib/unit-sites";
import { parsePpdbConfig, type PpdbConfig } from "@/lib/ppdb-config";

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
  history_html: string | null;
  vision: string | null;
  mission: string | null;
  profile_image: string | null;
  stat_students: string | null;
  stat_founded: string | null;
  hero_background: string | null;
  programs_background: string | null;
  carousel_images: string | null;
  youtube_url: string | null;
  address: string | null;
  phone: string | null;
  contact_email: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_youtube: string | null;
  map_embed_url: string | null;
  wa_number: string | null;
  wa_message: string | null;
  ppdb_config: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  og_image: string | null;
}

export interface UnitSiteNews extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  category: string | null;
  content: string | null;
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
  description: string | null;
  start_date: string;
  location: string | null;
}

export interface UnitSiteTestimonial extends RowDataPacket {
  id: number;
  author_name: string;
  role: string | null;
  content: string;
  image_url: string | null;
}

export interface UnitSiteGallery extends RowDataPacket {
  id: number;
  title: string | null;
  image_url: string | null;
  created_at: string | null;
}

export interface UnitSiteProgram extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
}

export interface UnitSiteFaq extends RowDataPacket {
  id: number;
  question: string;
  answer: string;
  category: string | null;
}

export interface UnitSiteData {
  unit: UnitSiteUnit;
  news: UnitSiteNews[];
  events: UnitSiteEvent[];
  testimonials: UnitSiteTestimonial[];
  galleries: UnitSiteGallery[];
  programs: UnitSiteProgram[];
  faqs: UnitSiteFaq[];
  foundationLogo: string | null;
  ppdb: PpdbConfig | null;
}

export interface UnitNewsDetailData {
  unit: UnitSiteUnit;
  news: UnitSiteNewsDetail;
}

export interface UnitNewsListData {
  unit: UnitSiteUnit;
  news: UnitSiteNews[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UnitAgendaData {
  unit: UnitSiteUnit;
  events: UnitSiteEvent[];
}

export interface UnitGalleryData {
  unit: UnitSiteUnit;
  galleries: UnitSiteGallery[];
}

const UNIT_COLUMNS = `id, name, slug, description, tagline, image_url, logo_url, primary_color, secondary_color, content, history_html, vision, mission, profile_image, stat_students, stat_founded, hero_background, programs_background, carousel_images, youtube_url, address, phone, contact_email, social_instagram, social_facebook, social_youtube, map_embed_url, wa_number, wa_message, ppdb_config, hero_title, hero_subtitle, og_image`;

function fallbackUnit(slug: string): UnitSiteUnit | null {
  if (!isKnownUnitSlug(slug)) return null;
  const preset = UNIT_FALLBACK[slug];
  return {
    id: 0,
    slug,
    name: preset.name,
    description: null,
    tagline: preset.tagline,
    image_url: null,
    logo_url: null,
    primary_color: null,
    secondary_color: null,
    content: null,
    history_html: null,
    vision: null,
    mission: null,
    profile_image: null,
    stat_students: null,
    stat_founded: null,
    hero_background: null,
    programs_background: null,
    carousel_images: null,
    youtube_url: null,
    address: null,
    phone: null,
    contact_email: null,
    social_instagram: null,
    social_facebook: null,
    social_youtube: null,
    map_embed_url: null,
    wa_number: null,
    wa_message: null,
    ppdb_config: null,
    hero_title: null,
    hero_subtitle: null,
    og_image: null,
  } as UnitSiteUnit;
}

export async function getUnitSiteUnit(slug: string): Promise<UnitSiteUnit | null> {
  try {
    const [rows] = await pool.execute<UnitSiteUnit[]>(
      `SELECT ${UNIT_COLUMNS} FROM units WHERE slug = ? AND status = 'active'`,
      [slug]
    );
    return rows[0] ?? fallbackUnit(slug);
  } catch (error) {
    // DB sementara tak terjangkau: unit yang dikenal tetap tampil, bukan 404 seluruh situs.
    console.error("Failed to load unit, serving fallback shell", error);
    return fallbackUnit(slug);
  }
}

export async function getUnitSiteData(slug: string): Promise<UnitSiteData | null> {
  const unit = await getUnitSiteUnit(slug);
  if (!unit) return null;
  const settings = await getSettings();
  const foundationLogo = settings.site_logo || null;
  const ppdb = parsePpdbConfig(unit.ppdb_config);
  if (!unit.id) {
    return { unit, news: [], events: [], testimonials: [], galleries: [], programs: [], faqs: [], foundationLogo, ppdb };
  }

  // One failing feed must not blank the others.
  const results = await Promise.allSettled([
    pool.execute<UnitSiteNews[]>(
      `SELECT id, title, slug, category, content, image_url, published_at, created_at
       FROM news WHERE status = 'published' AND unit_id = ?
       ORDER BY published_at DESC LIMIT 6`,
      [unit.id]
    ),
    pool.execute<UnitSiteEvent[]>(
      `SELECT id, title, description, start_date, location FROM events
       WHERE start_date >= CURRENT_DATE() AND unit_id = ?
       ORDER BY start_date ASC LIMIT 5`,
      [unit.id]
    ),
    pool.execute<UnitSiteTestimonial[]>(
      `SELECT id, author_name, role, content, image_url FROM testimonials
       WHERE is_active = 1 AND unit_id = ?
       ORDER BY order_index ASC LIMIT 3`,
      [unit.id]
    ),
    pool.execute<UnitSiteGallery[]>(
      `SELECT id, title, image_url, created_at FROM galleries
       WHERE unit_id = ? ORDER BY created_at DESC LIMIT 6`,
      [unit.id]
    ),
    pool.execute<UnitSiteProgram[]>(
      `SELECT id, title, description, image_url FROM programs
       WHERE status = 'active' AND unit_id = ?
       ORDER BY order_index ASC LIMIT 6`,
      [unit.id]
    ),
    pool.execute<UnitSiteFaq[]>(
      `SELECT id, question, answer, category FROM faqs
       WHERE is_active = 1 AND unit_id = ?
       ORDER BY order_index ASC, id DESC LIMIT 12`,
      [unit.id]
    ),
  ]);

  const fulfilled = <T>(index: number): T[] => results[index].status === "fulfilled" ? (results[index] as PromiseFulfilledResult<[T[], unknown]>).value[0] : [];
  results.forEach((result) => {
    if (result.status === "rejected") console.error("Failed to load unit site content", result.reason);
  });

  return {
    unit,
    news: fulfilled<UnitSiteNews>(0),
    events: fulfilled<UnitSiteEvent>(1),
    testimonials: fulfilled<UnitSiteTestimonial>(2),
    galleries: fulfilled<UnitSiteGallery>(3),
    programs: fulfilled<UnitSiteProgram>(4),
    faqs: fulfilled<UnitSiteFaq>(5),
    foundationLogo,
    ppdb,
  };
}

export async function getUnitNewsDetail(newsSlug: string, unitSlug: string): Promise<UnitNewsDetailData | null> {
  const unit = await getUnitSiteUnit(unitSlug);
  if (!unit) return null;
  // Fallback shell (DB down / unit belum ada) tidak punya berita: jangan tampilkan 200 palsu.
  if (!unit.id) return null;

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

export async function getUnitNewsList(unitSlug: string, requestedPage: number): Promise<UnitNewsListData | null> {
  const unit = await getUnitSiteUnit(unitSlug);
  if (!unit) return null;
  if (!unit.id) return { unit, news: [], total: 0, page: 1, totalPages: 1 };

  const pageSize = 8;
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const offset = (page - 1) * pageSize;
  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM news WHERE status = 'published' AND unit_id = ?`,
    [unit.id]
  );
  const total = Number(countRows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [rows] = await pool.execute<UnitSiteNews[]>(
    `SELECT id, title, slug, category, content, image_url, published_at, created_at
     FROM news WHERE status = 'published' AND unit_id = ?
     ORDER BY published_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
    [unit.id]
  );

  return { unit, news: rows, total, page, totalPages };
}

export async function getUnitAgenda(unitSlug: string): Promise<UnitAgendaData | null> {
  const unit = await getUnitSiteUnit(unitSlug);
  if (!unit) return null;
  if (!unit.id) return { unit, events: [] };

  const [rows] = await pool.execute<UnitSiteEvent[]>(
    `SELECT id, title, description, start_date, location FROM events
     WHERE start_date >= CURRENT_DATE() AND unit_id = ?
     ORDER BY start_date ASC LIMIT 30`,
    [unit.id]
  );
  return { unit, events: rows };
}

export async function getUnitGallery(unitSlug: string): Promise<UnitGalleryData | null> {
  const unit = await getUnitSiteUnit(unitSlug);
  if (!unit) return null;
  if (!unit.id) return { unit, galleries: [] };

  const [rows] = await pool.execute<UnitSiteGallery[]>(
    `SELECT id, title, image_url, created_at FROM galleries
     WHERE unit_id = ? ORDER BY created_at DESC LIMIT 60`,
    [unit.id]
  );
  return { unit, galleries: rows };
}

