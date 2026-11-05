import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TestimonialsSection, type Testimonial } from "@/components/TestimonialsSection";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";
import { getSettings } from "@/lib/db";
import { HeroParallax } from "@/components/parallax/HeroParallax";
import { ImageParallax } from "@/components/parallax/ImageParallax";
import { TiltCard } from "@/components/parallax/TiltCard";
import DOMPurify from "isomorphic-dompurify";
import { LogoFill } from "@/components/LogoFill";

// Revalidate page every 60 seconds (ISR)
export const revalidate = 60;

export default async function Home() {
  const settings = await getSettings();
  
  let units: RowDataPacket[] = [];
  let programs: RowDataPacket[] = [];
  let news: RowDataPacket[] = [];
  let galleries: RowDataPacket[] = [];
  let testimonials: RowDataPacket[] = [];

  try {
    const [
      [unitsRows],
      [programsRows],
      [newsRows],
      [galleriesRows],
      [testimonialsRows],
    ] = await Promise.all([
      pool.execute<RowDataPacket[]>("SELECT id, name, slug, image_url, description FROM units WHERE status = 'active' ORDER BY order_index ASC"),
      pool.execute<RowDataPacket[]>("SELECT id, title, description, image_url FROM programs WHERE status = 'active' ORDER BY order_index ASC"),
      pool.execute<RowDataPacket[]>("SELECT id, title, slug, image_url, category, published_at FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT 3"),
      pool.execute<RowDataPacket[]>("SELECT id, title, image_url FROM galleries ORDER BY created_at DESC LIMIT 6"),
      pool.execute<RowDataPacket[]>("SELECT id, author_name, role, content, image_url FROM testimonials WHERE is_active = 1 ORDER BY order_index ASC"),
    ]);
    units = unitsRows;
    programs = programsRows;
    news = newsRows;
    galleries = galleriesRows;
    testimonials = testimonialsRows;
  } catch (error) {
    console.error("Failed to fetch data for homepage", error);
  }

  // Total siswa aktif dari API Keuangan
  let totalStudents: number | null = null;
  try {
    const keuUrl = process.env.KEUANGAN_API_URL || "http://localhost:3000";
    const keuKey = process.env.KEUANGAN_INTEGRATION_KEY;
    if (keuKey) {
      const res = await fetch(`${keuUrl}/api/integration/student-count`, {
        headers: { Authorization: `Bearer ${keuKey}` },
        signal: AbortSignal.timeout(3000),
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && typeof json?.data?.total === "number") {
          totalStudents = json.data.total;
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch student count from Keuangan API", error);
  }

  const heroBg = settings.hero_background && !settings.hero_background.startsWith('/uploads/dummy/')
    ? settings.hero_background : '/uploads/dummy/hero_bg.png';

  return (
    <>
      <div style={{position:'fixed',inset:0,zIndex:0}}>
        <div style={{position:'absolute',inset:0,backgroundImage:`url(${heroBg})`,backgroundSize:'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat'}} />
        <div style={{position:'absolute',inset:0,backgroundColor:'rgba(6,78,59,0.6)'}} />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col">
      <Header />
      
      {/* HERO SECTION — taller spacer to keep content from entering viewport during fill */}
      <section style={{ minHeight: 'calc(100vh + 400px)' }} className="relative flex items-center justify-center overflow-hidden">
        <HeroParallax />

        <LogoFill logoSrc={
          settings.site_logo && !settings.site_logo.startsWith('/uploads/dummy/')
            ? settings.site_logo : '/logo.png'
        } />

        {/* Decorative elements */}
        <div data-hero-wave className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-[calc(100%+1.3px)] h-[70px] md:h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.93,121.9,198.8,111.45,241.65,104.81,283.47,82.46,321.39,56.44Z" className="fill-gray-50"></path>
          </svg>
        </div>
      </section>

      {/* TENTANG SECTION — Heritage */}
      <section id="tentang" className="py-16 md:py-24 bg-gray-50 relative overflow-hidden">
        {/* 8-point star motif */}
        <svg className="absolute -top-10 -right-10 w-[28rem] h-[28rem] text-primary-500 opacity-[0.05] pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="15" y="15" width="70" height="70" />
          <rect x="15" y="15" width="70" height="70" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="33" />
        </svg>
        <svg className="absolute -bottom-16 -left-12 w-80 h-80 text-accent-default opacity-[0.06] pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="15" y="15" width="70" height="70" />
          <rect x="15" y="15" width="70" height="70" transform="rotate(45 50 50)" />
        </svg>

        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left: narrative */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-px w-10 bg-primary-500"></span>
                <span className="text-primary-600 font-semibold tracking-[0.22em] text-xs uppercase">Profil Yayasan</span>
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-6">Sejarah &amp; Visi Kami</h2>

              {settings.profile_history ? (
                <div className="text-gray-600 text-lg leading-relaxed mb-2 prose prose-lg" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(settings.profile_history) }} />
              ) : (
                <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                  <p>
                    Berdiri sejak tahun 2005, Yayasan Nuurul Muttaqiin telah berkomitmen untuk memberikan pendidikan Islam yang komprehensif. Kami percaya bahwa pendidikan tidak hanya tentang akademis, melainkan pembentukan karakter yang kuat.
                  </p>
                  <p>
                    Dengan fasilitas modern dan tenaga pengajar profesional, kami mendidik ribuan siswa setiap tahunnya untuk siap menghadapi masa depan tanpa meninggalkan nilai-nilai Islam.
                  </p>
                </div>
              )}

              {settings.profile_vision && (
                <figure className="relative my-9 pl-6 border-l-[3px] border-accent-default">
                  <span aria-hidden className="absolute -top-4 left-2 font-serif text-6xl leading-none text-accent-default/25">“</span>
                  <p className="font-serif italic text-xl md:text-2xl text-gray-700 leading-relaxed">{settings.profile_vision}</p>
                  <figcaption className="mt-2 text-xs font-semibold uppercase tracking-wider text-accent-default">Visi</figcaption>
                </figure>
              )}

              {settings.profile_mission && (
                <div className="mb-2">
                  <h3 className="font-serif text-2xl font-bold text-gray-900 mb-5">Misi</h3>
                  <ul className="relative ml-3 border-l-2 border-primary-200 space-y-6">
                    {settings.profile_mission.split("\n").map((line, i) => {
                      const text = line.trim().replace(/^Misi\s*\d+[\.:]?\s*/i, "").trim();
                      if (!text) return null;
                      return (
                        <li key={i} className="relative pl-8">
                          <span className="absolute -left-[15px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white ring-4 ring-gray-50">{i + 1}</span>
                          <p className="text-gray-600 leading-relaxed">{text}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-10 pt-8 border-t border-gray-200 grid grid-cols-3 gap-4">
                {[
                  { v: units.length || 0, l: "Unit Sekolah", c: "text-primary-600" },
                  { v: totalStudents != null ? totalStudents.toLocaleString("id-ID") : (settings.stat_students || "—"), l: "Siswa Aktif", c: "text-accent-default" },
                  { v: "1995", l: "Tahun Berdiri", c: "text-primary-600" },
                ].map((s, i) => (
                  <div key={i}>
                    <div className={`text-3xl md:text-4xl font-bold leading-none ${s.c}`}>{s.v}</div>
                    <div className="mt-2 text-[11px] uppercase tracking-wider text-gray-400">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: portrait */}
            <div className="relative mt-10 lg:mt-0 lg:col-span-5 lg:pl-4">
              <div className="aspect-[4/5] rounded-2xl bg-gray-200 overflow-hidden relative shadow-2xl">
                {settings.profile_image && !settings.profile_image.startsWith('/uploads/dummy/') ? (
                  <img src={settings.profile_image} alt="Gedung Yayasan" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <img src="/uploads/dummy/about_img.png" alt="Gedung Yayasan" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                )}
              </div>
              <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-xl shadow-xl max-w-xs hidden md:block">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-accent-default rounded-full flex items-center justify-center text-xl">🏆</div>
                  <div>
                    <h4 className="font-bold text-gray-900">Akreditasi A</h4>
                    <p className="text-sm text-gray-500">Untuk seluruh unit sekolah</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UNIT SEKOLAH SECTION */}
      <section id="unit" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="h-px w-8 bg-primary-500"></span>
              <span className="text-primary-600 font-semibold tracking-[0.22em] text-xs uppercase">Jenjang Pendidikan</span>
              <span className="h-px w-8 bg-primary-500"></span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">Layanan Pendidikan</h2>
            <p className="text-gray-600 text-lg">Jenjang pendidikan terpadu dan berkelanjutan dari usia dini hingga kejuruan.</p>
          </div>

          {units.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-7">
              {units.map((unit) => (
                <Link key={unit.id} href={`/unit/${unit.slug}`} className="group block h-full">
                  <TiltCard className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 h-full flex flex-col transition-all duration-300">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      {unit.image_url ? (
                        <img src={unit.image_url} alt={unit.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">[Foto {unit.name}]</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-950/80 via-primary-950/30 to-transparent p-4 pt-10">
                        <h3 className="font-bold text-lg text-white leading-snug">{unit.name}</h3>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">{unit.description}</p>
                      <span className="text-primary-600 font-semibold text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                        Detail Unit <span className="text-lg leading-none">&rarr;</span>
                      </span>
                    </div>
                  </TiltCard>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">Belum ada data unit sekolah.</div>
          )}
        </div>
      </section>

      {/* PROGRAM UNGGULAN SECTION */}
      {programs.length > 0 && (
      <section className="relative py-16 md:py-24 overflow-hidden bg-primary-950">
        {/* Parallax Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageParallax src={settings.programs_background || "/uploads/dummy/programs_bg.png"} alt="Programs Background" className="w-full h-full" />
          <div className="absolute inset-0 bg-primary-950/60 z-10"></div>
        </div>

        <div className="relative z-20 container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl font-bold text-white mb-4">Program Unggulan</h2>
            <p className="text-primary-100 text-lg">Program-program spesial untuk mencetak generasi berprestasi.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((prog) => (
              <TiltCard key={prog.id} className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/10 flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl">
                {prog.image_url ? (
                   <img src={prog.image_url} alt={prog.title} className="w-20 h-20 object-cover rounded-full mb-6 shadow-md" loading="lazy" decoding="async" />
                ) : (
                  <div className="w-20 h-20 bg-primary-100 rounded-full mb-6 flex items-center justify-center text-primary-600 text-2xl font-bold">
                    {prog.title.charAt(0)}
                  </div>
                )}
                <h3 className="font-bold text-xl text-gray-900 mb-3">{prog.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{prog.description}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* BERITA & KEGIATAN TERBARU */}
      {news.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">Berita & Kegiatan</h2>
                <p className="text-gray-600 text-lg">Informasi terkini seputar Yayasan Nuurul Muttaqiin.</p>
              </div>
              <Link href="/berita" className="hidden md:flex text-primary-600 font-semibold hover:text-primary-700 items-center gap-2">
                Lihat Semua Berita &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {news.map((n) => (
                <Link key={n.id} href={`/berita/${n.slug}`} className="group block h-full">
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100 flex flex-col h-full">
                    <div className="aspect-[16/10] relative overflow-hidden bg-gray-100">
                      {n.image_url ? (
                        <img src={n.image_url} alt={n.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">Tidak ada gambar</div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                       <div className="text-xs font-bold text-primary-600 mb-2 uppercase tracking-wider">{n.category || "Berita Umum"}</div>
                       <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">{n.title}</h3>
                       <p className="text-gray-600 text-sm line-clamp-3 mb-4">{n.content.replace(/<[^>]+>/g, '')}</p>
                       <div className="mt-auto text-sm text-gray-500 flex justify-between items-center">
                         <span>{new Date(n.published_at || n.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                         <span className="text-primary-600 font-medium group-hover:underline">Baca &rarr;</span>
                       </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="mt-8 text-center md:hidden">
              <Link href="/berita" className="inline-block text-primary-600 font-semibold border border-primary-600 px-6 py-2 rounded-full">
                Lihat Semua Berita
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* GALERI KEGIATAN */}
      {galleries.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-900 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-serif text-4xl font-bold mb-4">Galeri Kegiatan</h2>
              <p className="text-gray-400 text-lg">Momen berharga dan aktivitas positif di lingkungan yayasan.</p>
            </div>
            
            <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
              {galleries.map((img) => (
                <div key={img.id} className="break-inside-avoid relative group rounded-xl overflow-hidden">
                  <img src={img.image_url} alt={img.title || "Galeri"} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <h4 className="font-bold text-lg text-white">{img.title}</h4>
                    {img.created_at && (
                      <span className="text-xs text-gray-300">{new Date(img.created_at).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONI */}
      <TestimonialsSection data={testimonials as Testimonial[]} />

      <Footer />
    </main>
    </>
  );
}
