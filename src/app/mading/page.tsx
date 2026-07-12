import Link from "next/link";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { MadingHeader } from "@/components/mading/MadingHeader";
import { MadingFooter } from "@/components/mading/MadingFooter";
import { ThemeProvider } from "@/components/mading/ThemeProvider";
import { PostCard } from "@/components/mading/PostCard";
import { UnitLogo } from "@/components/mading/UnitLogo";
import { BookOpen, PenLine, CheckCircle2, Eye, Layers, Users, GraduationCap, ArrowRight } from "lucide-react";

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
      `SELECT p.id, p.slug, p.title, LEFT(p.content, 180) as excerpt, p.cover_image, p.published_at, p.views,
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
      const s = statRows[0] as any;
      stats = {
        units: s.units || 0,
        posts: s.posts || 0,
        writers: s.writers || 0,
        categories: s.categories || 0,
      };
    }
  } catch (e) { console.error("stats fetch", e); }

  const statCards = [
    { label: "Unit Pendidikan", value: stats.units, icon: GraduationCap },
    { label: "Tulisan Terbit", value: stats.posts, icon: BookOpen },
    { label: "Penulis Aktif", value: stats.writers, icon: Users },
    { label: "Kategori", value: stats.categories, icon: Layers },
  ];

  const steps = [
    { icon: PenLine, title: "Tulis & Kirim", desc: "Siswa menulis tulisan lalu mengirimkannya untuk direview." },
    { icon: CheckCircle2, title: "Review Guru", desc: "Guru memeriksa, menyetujui, atau meminta revisi pada tulisan." },
    { icon: Eye, title: "Terbit & Dibaca", desc: "Tulisan yang disetujui terbit dan bisa dibaca seluruh unit." },
  ];

  return (
    <ThemeProvider>
      <MadingHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-linear-to-br from-primary-700 via-primary-800 to-primary-900 text-white">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-accent-default/20 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 backdrop-blur-sm">
              <BookOpen className="h-4 w-4" />
              Mading Online Yayasan Nuurul Muttaqiin
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight max-w-3xl mx-auto">
              Wadah Kreativitas & Ekspresi Siswa
            </h1>
            <p className="mt-5 text-lg text-primary-100 max-w-2xl mx-auto leading-relaxed">
              Ruang publikasi tulisan, karya, dan ide siswa lintas unit — dari LPQ hingga SMK.
              Baca, inspirasi, dan bagikan suara mereka.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#units"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-800 font-semibold hover:bg-primary-50 transition-colors shadow-lg shadow-primary-900/20">
                Jelajahi Unit
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/mading/siswa/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
                Masuk sebagai Siswa
              </Link>
            </div>
          </div>
        </section>

        {/* Stats band */}
        <section className="relative z-10 -mt-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{c.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{c.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Units */}
        <section id="units" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20 scroll-mt-20">
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Pilih Unit</h2>
              <p className="text-gray-500 mt-1">Setiap unit memiliki mading dengan karya unik siswanya.</p>
            </div>
          </div>

          {units.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              Belum ada unit yang tersedia.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {units.map((unit) => (
                <Link key={unit.id} href={`/mading/${unit.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-xl hover:border-primary-200 hover:-translate-y-1 transition-all">
                  <div className="w-20 h-20 rounded-2xl bg-gray-50 mx-auto mb-4 flex items-center justify-center overflow-hidden ring-1 ring-gray-100">
                    <UnitLogo src={unit.logo_url} slug={unit.slug} alt={unit.name} />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors leading-snug">
                    {unit.name}
                  </h3>
                  {unit.tagline && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{unit.tagline}</p>
                  )}
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                    <BookOpen className="h-3.5 w-3.5" />
                    {unit.post_count || 0} tulisan
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Cara Bermading</h2>
              <p className="text-gray-500 mt-1">Tiga langkah sederhana menuju tulisan terbit.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.title} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <span className="absolute -top-3 left-6 h-7 w-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1.5">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Latest posts */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tulisan Terbaru</h2>
              <p className="text-gray-500 mt-1">Karya terbaru dari seluruh unit yang telah terbit.</p>
            </div>
            {units[0] && (
              <a href={`/mading/${units[0].slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700">
                Lihat semuanya
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>

          {recentPosts.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              Belum ada tulisan yang terbit.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={{
                  id: post.id,
                  slug: post.slug,
                  title: post.title,
                  excerpt: post.excerpt || "",
                  cover_image: post.cover_image,
                  author_name: post.author_name,
                  category_name: post.category_name,
                  category_slug: post.category_slug,
                  published_at: post.published_at,
                  created_at: post.created_at,
                }} unitSlug={post.unit_slug} />
              ))}
            </div>
          )}
        </section>

        {/* CTA band */}
        <section className="bg-linear-to-br from-primary-700 to-primary-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Punyai tulisan? Bagikan di mading.</h2>
            <p className="mt-2 text-primary-100 max-w-xl mx-auto">
              Masuk sebagai siswa untuk mulai menulis, atau sebagai guru untuk mereview karya siswa.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/mading/siswa/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-800 font-semibold hover:bg-primary-50 transition-colors">
                <PenLine className="h-4 w-4" />
                Mulai Menulis
              </Link>
              <Link href="/mading/guru/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/30 font-semibold hover:bg-white/10 transition-colors">
                <CheckCircle2 className="h-4 w-4" />
                Login Guru
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MadingFooter />
    </ThemeProvider>
  );
}
