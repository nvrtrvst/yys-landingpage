import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { notFound } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

interface UnitRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  content: string | null;
}

interface ProgramRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
}

interface UnitCard extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
}

function isRealImage(url: string | null | undefined): url is string {
  return !!url && !url.startsWith("/uploads/dummy/");
}

function isMeaningful(value: string | null | undefined, min: number): value is string {
  return !!value && value.trim().length >= min;
}

async function getUnit(slug: string): Promise<UnitRow | null> {
  const [rows] = await pool.execute<UnitRow[]>(
    "SELECT id, name, slug, image_url, description, address, phone, content FROM units WHERE slug = ? AND status = 'active'",
    [slug]
  );
  return rows[0] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const unit = await getUnit(slug);
    if (!unit) return { title: "Unit" };
    const description = unit.description || `Informasi ${unit.name} di Yayasan Nuurul Muttaqiin.`;
    return {
      title: unit.name,
      description,
      alternates: { canonical: `/unit/${unit.slug}` },
      openGraph: {
        title: unit.name,
        description,
        url: `/unit/${unit.slug}`,
        images: isRealImage(unit.image_url) ? [{ url: unit.image_url, alt: unit.name }] : undefined,
      },
    };
  } catch {
    return { title: "Unit" };
  }
}

export default async function UnitDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let unit: UnitRow | null = null;
  let programs: ProgramRow[] = [];
  let otherUnits: UnitCard[] = [];

  try {
    unit = await getUnit(slug);
    if (!unit) notFound();

    const [[programRows], [otherRows]] = await Promise.all([
      pool.execute<ProgramRow[]>(
        "SELECT id, title, description, image_url FROM programs WHERE unit_id = ? AND status = 'active' ORDER BY order_index ASC",
        [unit.id]
      ),
      pool.execute<UnitCard[]>(
        "SELECT id, name, slug, image_url, description FROM units WHERE status = 'active' AND id <> ? ORDER BY order_index ASC LIMIT 4",
        [unit.id]
      ),
    ]);
    programs = programRows;
    otherUnits = otherRows;
  } catch (error) {
    console.error("Failed to fetch unit detail", error);
    notFound();
  }

  const rawContent = unit.content || "";
  const profileHtml = rawContent && !/lorem ipsum/i.test(rawContent) ? DOMPurify.sanitize(rawContent) : "";
  const address = isMeaningful(unit.address, 12) ? unit.address : null;
  const phone = isMeaningful(unit.phone, 6) ? unit.phone : null;
  const heroImage = isRealImage(unit.image_url) ? unit.image_url : null;
  const ppdbHref = `/ppdb?unit=${unit.slug}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nuurulmuttaqiin.or.id";
  const absoluteImage = heroImage
    ? heroImage.startsWith("http")
      ? heroImage
      : `${baseUrl}${heroImage}`
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: unit.name,
    description: unit.description || undefined,
    image: absoluteImage,
    url: `${baseUrl}/unit/${unit.slug}`,
    address: address || undefined,
    telephone: phone || undefined,
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-primary-950 text-white">
        <Header />
        <section className="pb-16 pt-28 md:pb-24 md:pt-36">
          <div className="container mx-auto px-4 md:px-6">
            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-primary-200">
              <Link href="/" className="hover:text-white">Beranda</Link>
              <span aria-hidden="true">/</span>
              <Link href="/#unit" className="hover:text-white">Unit</Link>
              <span aria-hidden="true">/</span>
              <span className="text-white">{unit.name}</span>
            </nav>

            <div className={`grid items-center gap-10 ${heroImage ? "lg:grid-cols-2" : ""}`}>
              <div className={heroImage ? "" : "mx-auto max-w-3xl text-center"}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-default">
                  Unit Pendidikan
                </p>
                <h1 className="mt-4 font-serif text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                  {unit.name}
                </h1>
                {unit.description ? (
                  <p className={`mt-5 text-lg leading-relaxed text-primary-100 ${heroImage ? "max-w-2xl" : "mx-auto max-w-2xl"}`}>
                    {unit.description}
                  </p>
                ) : null}

                <div className={`mt-8 flex flex-wrap items-center gap-3 ${heroImage ? "" : "justify-center"}`}>
                  <Link
                    href={ppdbHref}
                    className="inline-flex min-h-11 items-center rounded-lg bg-accent-default px-5 py-3 text-sm font-semibold text-primary-900 transition-colors hover:bg-accent-light"
                  >
                    Daftar PPDB
                  </Link>
                  <Link
                    href="#profil"
                    className="inline-flex min-h-11 items-center rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Profil Unit
                  </Link>
                </div>

                {(address || phone) && (
                  <div className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-100 ${heroImage ? "" : "justify-center"}`}>
                    {address ? (
                      <span className="inline-flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-default" aria-hidden="true" />
                        {address}
                      </span>
                    ) : null}
                    {phone ? (
                      <a href={`tel:${phone}`} className="inline-flex items-center gap-2 hover:text-white">
                        <Phone className="h-4 w-4 shrink-0 text-accent-default" aria-hidden="true" />
                        {phone}
                      </a>
                    ) : null}
                  </div>
                )}
              </div>

              {heroImage ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white p-3">
                  <img
                    src={heroImage}
                    alt={`Foto ${unit.name}`}
                    className="mx-auto max-h-[360px] w-full object-contain md:max-h-[420px]"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <section id="profil" className="bg-white py-16 md:py-24">
        <div className="container mx-auto grid gap-10 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Profil</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-gray-900 md:text-4xl">
              Tentang {unit.name}
            </h2>

            {profileHtml ? (
              <div
                className="prose prose-lg prose-primary mt-6 max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: profileHtml }}
              />
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-6">
                <p className="text-sm leading-relaxed text-slate-600">
                  {unit.description || "Informasi profil unit ini belum tersedia."}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Profil lengkap belum tersedia. Silakan hubungi panitia untuk informasi lebih lanjut.
                </p>
                <Link href={ppdbHref} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary-700 hover:underline">
                  Daftar PPDB
                </Link>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Kontak Unit</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                {address ? (
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                    {address}
                  </p>
                ) : null}
                {phone ? (
                  <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-primary-700">
                    <Phone className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                    {phone}
                  </a>
                ) : null}
                {!address && !phone ? (
                  <p className="text-sm text-slate-500">Informasi kontak unit belum tersedia.</p>
                ) : null}
              </div>
              <Link
                href={ppdbHref}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Daftar PPDB
              </Link>
            </div>

            <div className="rounded-xl border border-slate-200 bg-primary-50/50 p-5">
              <p className="text-sm font-semibold text-slate-900">Butuh informasi lain?</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Lihat unit pendidikan lain atau kembali ke halaman PPDB.
              </p>
              <Link href="/#unit" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-700 hover:underline">
                Lihat Unit Lain
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {programs.length > 0 && (
        <section id="program" className="bg-primary-50 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Program</p>
              <h2 className="mt-3 font-serif text-3xl font-bold text-gray-900 md:text-4xl">Program Unggulan</h2>
              <p className="mt-3 text-slate-600">Program yang tersedia di {unit.name}.</p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <article key={program.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6">
                  {isRealImage(program.image_url) ? (
                    <img
                      src={program.image_url}
                      alt={program.title}
                      className="h-20 w-20 rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700" aria-hidden="true">
                      {program.title.charAt(0)}
                    </div>
                  )}
                  <h3 className="mt-5 text-lg font-semibold text-gray-900">{program.title}</h3>
                  {program.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{program.description}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {otherUnits.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Jelajahi</p>
                <h2 className="mt-3 font-serif text-3xl font-bold text-gray-900 md:text-4xl">Unit Lainnya</h2>
              </div>
              <Link href="/#unit" className="text-sm font-semibold text-primary-700 hover:underline">
                Semua Unit
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {otherUnits.map((other) => (
                <Link
                  key={other.slug}
                  href={`/unit/${other.slug}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-primary-300"
                >
                  {isRealImage(other.image_url) ? (
                    <img
                      src={other.image_url}
                      alt={`Foto ${other.name}`}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] w-full items-center justify-center bg-primary-50" aria-hidden="true">
                      <span className="text-3xl font-bold text-primary-700">{other.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">{other.name}</p>
                    {other.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{other.description}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-primary-950 py-16 text-center text-white md:py-20">
        <div className="container mx-auto max-w-3xl px-4 md:px-6">
          <h2 className="font-serif text-3xl font-bold md:text-4xl">Bergabung dengan {unit.name}</h2>
          {unit.description ? <p className="mt-4 text-primary-100">{unit.description}</p> : null}
          <Link
            href={ppdbHref}
            className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-accent-default px-6 py-3 text-sm font-semibold text-primary-900 transition-colors hover:bg-accent-light"
          >
            Daftar PPDB
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
