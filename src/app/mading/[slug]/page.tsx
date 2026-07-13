import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getUnitBySlug } from "@/lib/mading";
import { UnitPageClient } from "@/components/mading/UnitPageClient";

const PER_PAGE = 12;

export const revalidate = 60;

export default async function UnitMadingPage({
  params, searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; page?: string; q?: string }>;
}) {
  const slug = (await params).slug;
  const sp = await searchParams;
  const categorySlug = sp.category || null;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const query = (sp.q || "").trim();

  const unit = await getUnitBySlug(slug);
  if (!unit) return <div className="flex-1 flex items-center justify-center text-gray-500 py-20">Unit tidak ditemukan</div>;

  const [categories] = await pool.execute<RowDataPacket[]>(
    "SELECT id, slug, name FROM mading_categories WHERE (unit_id = ? OR unit_id IS NULL) AND is_active = 1 ORDER BY order_index ASC",
    [unit.id]
  );

  let activeCategory: RowDataPacket | undefined;
  const whereClauses: string[] = ["p.unit_id = ? AND p.status = 'approved'"];
  const queryParams: (string | number)[] = [unit.id];

  if (categorySlug) {
    const found = categories.find((c: RowDataPacket) => c.slug === categorySlug);
    if (found) {
      activeCategory = found;
      whereClauses.push("p.category_id = ?");
      queryParams.push(found.id);
    }
  }

  if (query) {
    whereClauses.push("(p.title LIKE ? OR p.content LIKE ?)");
    const like = `%${query}%`;
    queryParams.push(like, like);
  }

  const whereSql = whereClauses.join(" AND ");

  const [[countRows], [posts]] = await Promise.all([
    pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM mading_posts p WHERE ${whereSql}`, [...queryParams]
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT p.id, p.slug, p.title, LEFT(p.content, 200) as excerpt, p.cover_image, p.published_at, p.created_at, p.views,
              u.name as author_name, c.name as category_name, c.slug as category_slug
       FROM mading_posts p LEFT JOIN users u ON p.author_id = u.id LEFT JOIN mading_categories c ON p.category_id = c.id
       WHERE ${whereSql} ORDER BY p.published_at DESC LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`,
      [...queryParams]
    ),
  ]);
  const total = (countRows[0] as RowDataPacket).total;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    /* eslint-disable @typescript-eslint/no-explicit-any */
    <UnitPageClient unit={unit as any} categories={categories as any[]}
      activeCategory={activeCategory as any || null} posts={posts as any[]}
      slug={slug} categorySlug={categorySlug} query={query} page={page}
      totalPages={totalPages} total={total} />
    /* eslint-enable @typescript-eslint/no-explicit-any */
  );
}
