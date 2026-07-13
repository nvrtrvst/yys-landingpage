"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PostCard } from "./PostCard";
import { ArrowLeft } from "lucide-react";

interface UnitData {
  id: number; name: string; slug: string; tagline: string | null;
  logo_url: string | null;
}
interface CategoryData {
  id: number; slug: string; name: string;
}
interface PostRow {
  id: number; slug?: string; title: string; excerpt?: string;
  cover_image?: string | null; author_name?: string;
  category_name?: string; category_slug?: string;
  published_at?: string; created_at: string; views?: number;
}

function TiltCard({
  children, className = "",
}: {
  children: React.ReactNode; className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200, damping: 12 }}
    >
      {children}
    </motion.div>
  );
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1, y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

export function UnitPageClient({
  unit,
  categories,
  activeCategory,
  posts,
  slug,
  categorySlug,
  query,
  page,
  totalPages,
  total,
}: {
  unit: UnitData;
  categories: CategoryData[];
  activeCategory: CategoryData | null;
  posts: PostRow[];
  slug: string;
  categorySlug: string | null;
  query: string;
  page: number;
  totalPages: number;
  total: number;
}) {
  const buildUrl = (p: number, cat?: string, q?: string) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (cat) params.set("category", cat);
    if (q) params.set("q", q);
    const qs = params.toString();
    return `/mading/${slug}${qs ? "?" + qs : ""}`;
  };
  return (
    <div className="relative flex-1 bg-gradient-to-br from-stone-100 via-amber-50 to-amber-100">
      {/* Corkboard texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.10]"
        style={{
          backgroundImage: "radial-gradient(circle, #8B7355 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Back link */}
          <motion.div variants={itemVariants} className="mb-4">
            <Link
              href="/mading"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-primary-600"
            >
              <ArrowLeft className="h-4 w-4" /> Semua Unit
            </Link>
          </motion.div>

          {/* Unit header — pinned note */}
          <motion.div variants={itemVariants}>
            <TiltCard className="relative mb-8 rounded-2xl bg-white/80 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur sm:p-8">
              <span className="absolute -top-2 left-1/2 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-red-500 shadow-md ring-1 ring-black/10">
                <span className="h-2 w-2 rounded-full bg-white/70" />
              </span>
              <h1 className="font-serif text-2xl font-bold text-gray-900 md:text-3xl">
                Mading {unit.name}
              </h1>
              {unit.tagline && (
                <p className="mt-1 text-gray-500">{unit.tagline}</p>
              )}
              <p className="mt-2 text-sm text-gray-400">
                {total} tulisan {categorySlug && activeCategory ? `di "${activeCategory.name}"` : ""}
                {query ? ` — pencarian "${query}"` : ""}
              </p>
            </TiltCard>
          </motion.div>

          {/* Categories */}
          {categories.length > 0 && (
            <motion.div variants={itemVariants} className="mb-6 flex flex-wrap gap-2">
              <Link
                href={`/mading/${slug}${query ? `?q=${encodeURIComponent(query)}` : ""}`}
                className={`rounded-full px-3 py-1.5 text-sm font-medium shadow-sm transition ${
                  !activeCategory
                    ? "bg-primary-600 text-white shadow-primary-600/30"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                Semua
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/mading/${slug}?category=${cat.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium shadow-sm transition ${
                    activeCategory?.id === cat.id
                      ? "bg-primary-600 text-white shadow-primary-600/30"
                      : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </motion.div>
          )}

          {/* Search */}
          <motion.div variants={itemVariants}>
            <form
              method="GET"
              action={`/mading/${slug}`}
              className="mb-6 flex gap-2"
            >
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Cari tulisan..."
                autoFocus={!!query}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
              />
              {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
              <button
                type="submit"
                className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98]"
              >
                Cari
              </button>
            </form>
          </motion.div>

          {/* Posts */}
          {posts.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-dashed border-gray-200 bg-white/50 py-20 text-center text-gray-400"
            >
              <p className="text-lg">
                {query
                  ? `Tidak ditemukan "${query}"`
                  : `Belum ada tulisan${activeCategory ? ` di kategori "${activeCategory.name}"` : ""}`}
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {posts.map((post) => (
                  <motion.div key={post.id} variants={itemVariants}>
                    <TiltCard>
                      <div className="rounded-2xl bg-white shadow-lg ring-1 ring-black/5 transition-all hover:shadow-xl">
                        <PostCard post={post} unitSlug={slug} />
                      </div>
                    </TiltCard>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-center gap-3"
                >
                  {page > 1 && (
                    <Link
                      href={buildUrl(page - 1, categorySlug || undefined, query || undefined)}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 active:scale-[0.98]"
                    >
                      &larr; Sebelumnya
                    </Link>
                  )}
                  <span className="rounded-xl bg-white px-4 py-2 text-sm text-gray-500 shadow-sm ring-1 ring-gray-200">
                    Halaman {page} dari {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={buildUrl(page + 1, categorySlug || undefined, query || undefined)}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 active:scale-[0.98]"
                    >
                      Selanjutnya &rarr;
                    </Link>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
