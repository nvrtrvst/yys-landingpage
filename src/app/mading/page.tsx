import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { MadingHeader } from "@/components/mading/MadingHeader";
import { MadingFooter } from "@/components/mading/MadingFooter";
import { ThemeProvider } from "@/components/mading/ThemeProvider";
import { MadingHubClient } from "@/components/mading/MadingHubClient";

export const revalidate = 60;

export default async function MadingHub() {
  let units: RowDataPacket[] = [];
  let recentPosts: RowDataPacket[] = [];
  let stats = { units: 0, posts: 0, writers: 0, categories: 0 };

  try {
    const [unitRows] = await pool.execute<RowDataPacket[]>(
      `SELECT un.id, un.name, un.slug, un.logo_url, un.tagline, un.description,
              COUNT(p.id) as post_count
       FROM units un
       LEFT JOIN mading_posts p ON p.unit_id = un.id AND p.status = 'approved'
       WHERE un.status = 'active'
       GROUP BY un.id
       ORDER BY post_count DESC, un.name ASC`
    );
    units = unitRows;
  } catch (e) { console.error("unit fetch", e); }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.id, p.slug, p.title, LEFT(p.content, 180) as excerpt, p.cover_image, p.published_at, p.created_at, p.views,
              u.name as author_name, un.slug as unit_slug, un.name as unit_name, c.name as category_name, c.slug as category_slug
       FROM mading_posts p
       JOIN users u ON p.author_id = u.id
       JOIN units un ON p.unit_id = un.id
       LEFT JOIN mading_categories c ON p.category_id = c.id
       WHERE p.status = 'approved'
       ORDER BY p.published_at DESC
       LIMIT 9`
    );
    recentPosts = rows;
  } catch (e) { console.error("recent fetch", e); }

  try {
    const [statRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM units WHERE status = 'active') as units,
        (SELECT COUNT(*) FROM mading_posts WHERE status = 'approved') as posts,
        (SELECT COUNT(DISTINCT author_id) FROM mading_posts WHERE status = 'approved') as writers,
        (SELECT COUNT(*) FROM mading_categories WHERE is_active = 1) as categories`
    );
    if (statRows[0]) {
      const s = statRows[0] as RowDataPacket;
      stats = {
        units: s.units || 0,
        posts: s.posts || 0,
        writers: s.writers || 0,
        categories: s.categories || 0,
      };
    }
  } catch (e) { console.error("stats fetch", e); }

  return (
    <ThemeProvider>
      <MadingHeader />
      <main className="flex-1">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MadingHubClient units={units as any[]} recentPosts={recentPosts as any[]} stats={stats} />
      </main>
      <MadingFooter />
    </ThemeProvider>
  );
}
