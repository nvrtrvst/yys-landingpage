import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { PostCard } from "@/components/mading/PostCard";
import { getUnitBySlug } from "@/lib/mading";
import Link from "next/link";

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
    const found = categories.find((c: any) => c.slug === categorySlug);
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
  const total = (countRows[0] as any).total;
  const totalPages = Math.ceil(total / PER_PAGE);

  const buildUrl = (p: number, cat?: string, q?: string) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (cat) params.set("category", cat);
    if (q) params.set("q", q);
    const qs = params.toString();
    return `/mading/${slug}${qs ? "?" + qs : ""}`;
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Mading {unit.name}</h1>
        <p className="text-gray-500 mt-1">{unit.tagline || "Tulisan siswa terbaru"}</p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href={`/mading/${slug}${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeCategory ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>Semua</Link>
          {categories.map((cat: any) => (
            <Link key={cat.id}
              href={`/mading/${slug}?category=${cat.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory?.id === cat.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{cat.name}</Link>
          ))}
        </div>
      )}

      <form method="GET" action={`/mading/${slug}`} className="mb-6 flex gap-2">
        <input type="search" name="q" defaultValue={query} placeholder="Cari tulisan..." autoFocus={!!query}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Cari</button>
      </form>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">
            {query ? `Tidak ditemukan "${query}"` : `Belum ada tulisan${activeCategory ? ` di kategori "${activeCategory.name}"` : ""}`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {posts.map((post: any) => <PostCard key={post.id} post={post} unitSlug={slug} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              {page > 1 && (
                <Link href={buildUrl(page - 1, categorySlug || undefined, query || undefined)}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">&larr; Sebelumnya</Link>
              )}
              <span className="text-sm text-gray-500">Halaman {page} dari {totalPages}</span>
              {page < totalPages && (
                <Link href={buildUrl(page + 1, categorySlug || undefined, query || undefined)}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Selanjutnya &rarr;</Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
