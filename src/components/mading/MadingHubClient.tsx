"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useTransform,
  useScroll,
  useSpring,
} from "framer-motion";
import {
  BookOpen,
  PenLine,
  CheckCircle2,
  Eye,
  Layers,
  Users,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PostCard } from "./PostCard";
import { UnitLogo } from "./UnitLogo";

export interface HubUnitData {
  id: number; name: string; slug: string; logo_url: string | null;
  tagline: string | null; post_count: number;
}
export interface HubPostData {
  id: number; slug: string; title: string; excerpt: string;
  cover_image: string | null; published_at: string; views: number;
  author_name: string; unit_slug: string; unit_name: string;
  category_name: string | null; category_slug: string | null;
}
interface StatsData { units: number; posts: number; writers: number; categories: number; }

function TiltCard({
  children,
  className = "",
  style = {},
  tiltDegree = 6,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tiltDegree?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useTransform(y, [0, 1], [tiltDegree, -tiltDegree]);
  const rotateY = useTransform(x, [0, 1], [-tiltDegree, tiltDegree]);
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width);
    y.set((e.clientY - r.top) / r.height);
  };
  const handleLeave = () => { x.set(0.5); y.set(0.5); };
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Pin({ className = "" }: { className?: string }) {
  return (
    <span className={`absolute -top-2 left-1/2 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full shadow-md ring-1 ring-black/10 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-white/70" />
    </span>
  );
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
};

const paperNoteColors = [
  { bg: "bg-pink-200", pin: "bg-red-500" },
  { bg: "bg-purple-200", pin: "bg-purple-600" },
  { bg: "bg-yellow-200", pin: "bg-yellow-600" },
  { bg: "bg-blue-200", pin: "bg-blue-600" },
  { bg: "bg-teal-200", pin: "bg-teal-600" },
  { bg: "bg-orange-200", pin: "bg-orange-500" },
  { bg: "bg-rose-200", pin: "bg-rose-600" },
  { bg: "bg-lime-200", pin: "bg-lime-600" },
];

const decorativeNotes = [
  { top: "5%", left: "2%", w: 20, h: 24, rotate: -8, colorIdx: 0 },
  { top: "15%", right: "2%", w: 16, h: 20, rotate: 10, colorIdx: 1 },
  { bottom: "8%", left: "3%", w: 18, h: 22, rotate: -6, colorIdx: 2 },
  { bottom: "12%", right: "2%", w: 22, h: 26, rotate: 7, colorIdx: 3 },
];

export function MadingHubClient({
  units,
  recentPosts,
  stats,
}: {
  units: HubUnitData[];
  recentPosts: HubPostData[];
  stats: StatsData;
}) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  const statData = [
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
    <div className="relative min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-amber-100">
      {/* Progress bar */}
      <motion.div
        className="fixed left-0 right-0 top-0 z-50 h-1 origin-left bg-primary-600"
        style={{ scaleX }}
      />

      {/* Corkboard texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.10]"
        style={{
          backgroundImage: "radial-gradient(circle, #8B7355 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(139,115,85,0.08) 1px, rgba(139,115,85,0.08) 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(139,115,85,0.08) 1px, rgba(139,115,85,0.08) 2px)",
        }}
      />

      {/* Decorative floating notes */}
      {decorativeNotes.map((n, i) => {
        const c = paperNoteColors[n.colorIdx];
        return (
          <motion.div
            key={`dn${i}`}
            className={`pointer-events-none fixed z-0 hidden rounded-lg shadow-lg sm:flex ${c.bg}`}
            style={{
              top: n.top, left: n.left, right: n.right, bottom: n.bottom,
              width: `${n.w / 4}rem`, height: `${n.h / 4}rem`,
            }}
            initial={{ rotate: n.rotate, y: 0 }}
            animate={{ y: [0, -10, 0], rotate: [n.rotate, n.rotate + 1.5, n.rotate] }}
            transition={{ duration: 7 + i * 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Pin className={c.pin} />
          </motion.div>
        );
      })}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-[30rem] w-[30rem] rounded-full bg-stone-300/20 blur-3xl" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 md:pt-24 md:pb-16 text-center"
        >
          {/* Pinned hero note */}
          <TiltCard className="relative mx-auto max-w-2xl rounded-2xl bg-white/80 p-8 shadow-2xl ring-1 ring-black/5 backdrop-blur md:p-12" tiltDegree={4}>
            <Pin className="bg-red-500" />
            <motion.span
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700"
            >
              <BookOpen className="h-4 w-4" />
              Mading Online Yayasan Nuurul Muttaqiin
            </motion.span>
            <motion.h1
              variants={itemVariants}
              className="mt-5 font-serif text-4xl font-bold leading-tight text-gray-900 md:text-6xl"
            >
              Wadah Kreativitas &<br />Ekspresi Siswa
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-500"
            >
              Ruang publikasi tulisan, karya, dan ide siswa lintas unit — dari LPQ hingga SMK.
              Baca, inspirasi, dan bagikan suara mereka.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <a
                href="#units"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-600/30 transition hover:bg-primary-700 active:scale-[0.98]"
              >
                Jelajahi Unit
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/mading/login"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:border-primary-400 hover:text-primary-600 active:scale-[0.98]"
              >
                Masuk sebagai Siswa
              </Link>
            </motion.div>
          </TiltCard>
        </motion.div>
      </section>

      {/* Stats band — pinned notes */}
      <section className="relative z-10 -mt-6 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {statData.map((c, i) => {
            const Icon = c.icon;
            const color = paperNoteColors[i % paperNoteColors.length];
            return (
              <motion.div key={c.label} variants={itemVariants}>
                <TiltCard
                  className={`relative rounded-2xl p-5 shadow-lg ring-1 ring-black/5 ${color.bg}`}
                  tiltDegree={5}
                >
                  <Pin className={color.pin} />
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/60 text-gray-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold leading-none text-gray-900">{c.value}</p>
                      <p className="mt-1 text-sm text-gray-600">{c.label}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Units section */}
      <section id="units" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20 scroll-mt-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={itemVariants} className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 md:text-3xl">Pilih Unit</h2>
              <p className="mt-1 text-gray-500">Setiap unit memiliki mading dengan karya unik siswanya.</p>
            </div>
          </motion.div>

          {units.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center text-gray-400">
              Belum ada unit yang tersedia.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
              {units.map((unit) => (
                <motion.div key={unit.id} variants={itemVariants}>
                  <TiltCard tiltDegree={8}>
                    <Link
                      href={`/mading/${unit.slug}`}
                      className="group relative block rounded-2xl bg-white p-6 text-center shadow-lg ring-1 ring-black/5 transition-all hover:shadow-xl"
                    >
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-100">
                        <UnitLogo src={unit.logo_url} slug={unit.slug} alt={unit.name} />
                      </div>
                      <h3 className="font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary-600">
                        {unit.name}
                      </h3>
                      {unit.tagline && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                          {unit.tagline}
                        </p>
                      )}
                      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-600">
                        <BookOpen className="h-3.5 w-3.5" />
                        {unit.post_count || 0} tulisan
                      </div>
                    </Link>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="relative border-y border-gray-200/60 bg-white/50">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,115,85,0.06) 2px, rgba(139,115,85,0.06) 3px)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div variants={itemVariants} className="mb-10 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
                <Sparkles className="h-4 w-4" /> Cara Bermading
              </span>
              <h2 className="mt-3 font-serif text-2xl font-bold text-gray-900 md:text-3xl">Tiga Langkah Mudah</h2>
              <p className="mt-1 text-gray-500">Dari menulis hingga tulisanmu terbit dan dibaca.</p>
            </motion.div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const color = paperNoteColors[i % paperNoteColors.length];
                return (
                  <motion.div key={s.title} variants={itemVariants}>
                    <TiltCard
                      className={`relative rounded-2xl p-6 shadow-lg ring-1 ring-black/5 ${color.bg}`}
                      tiltDegree={5}
                    >
                      <Pin className={color.pin} />
                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-sm font-bold text-gray-700">
                          {i + 1}
                        </span>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/60 text-gray-700">
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{s.desc}</p>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recent posts */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={itemVariants} className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 md:text-3xl">Tulisan Terbaru</h2>
              <p className="mt-1 text-gray-500">Karya terbaru dari seluruh unit yang telah terbit.</p>
            </div>
            {units[0] && (
              <a
                href={`/mading/${units[0].slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Lihat semuanya
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </motion.div>

          {recentPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center text-gray-400">
              Belum ada tulisan yang terbit.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <motion.div key={post.id} variants={itemVariants}>
                  <TiltCard tiltDegree={6}>
                    <div className="rounded-2xl bg-white shadow-lg ring-1 ring-black/5 transition-all hover:shadow-xl">
                      <PostCard
                        post={{
                          id: post.id,
                          slug: post.slug,
                          title: post.title,
                          excerpt: post.excerpt || "",
                          cover_image: post.cover_image,
                          author_name: post.author_name,
                          category_name: post.category_name ?? undefined,
                          category_slug: post.category_slug ?? undefined,
                          published_at: post.published_at,
                          created_at: post.published_at,
                        }}
                        unitSlug={post.unit_slug}
                      />
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-accent-default/10 blur-3xl" />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 text-center"
        >
          <motion.div variants={itemVariants}>
            <TiltCard
              className="mx-auto inline-block rounded-2xl bg-white/10 px-8 py-6 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm"
              tiltDegree={3}
            >
              <h2 className="text-2xl font-bold md:text-3xl">Punya tulisan? Bagikan di mading.</h2>
              <p className="mx-auto mt-2 max-w-xl text-primary-100">
                Masuk sebagai siswa untuk mulai menulis, atau sebagai guru untuk mereview karya siswa.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/mading/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-primary-800 shadow-lg transition hover:bg-primary-50 active:scale-[0.98]"
                >
                  <PenLine className="h-4 w-4" />
                  Mulai Menulis
                </Link>
                <Link
                  href="/mading/guru/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Login Guru
                </Link>
              </div>
            </TiltCard>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
