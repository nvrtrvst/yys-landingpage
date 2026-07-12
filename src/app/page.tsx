import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";
import { getSettings } from "@/lib/db";
import { HeroParallax } from "@/components/parallax/HeroParallax";
import { ImageParallax } from "@/components/parallax/ImageParallax";
import { TiltCard } from "@/components/parallax/TiltCard";
import DOMPurify from "isomorphic-dompurify";

// Revalidate page every 60 seconds (ISR)
export const revalidate = 60;

export default async function Home() {
  const settings = await getSettings();
  
  // Fetch data
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
      pool.execute<RowDataPacket[]>("SELECT * FROM units WHERE status = 'active' ORDER BY order_index ASC"),
      pool.execute<RowDataPacket[]>("SELECT * FROM programs WHERE status = 'active' ORDER BY order_index ASC"),
      pool.execute<RowDataPacket[]>("SELECT * FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT 3"),
      pool.execute<RowDataPacket[]>("SELECT * FROM galleries ORDER BY created_at DESC LIMIT 6"),
      pool.execute<RowDataPacket[]>("SELECT * FROM testimonials WHERE is_active = 1 ORDER BY order_index ASC"),
    ]);
    units = unitsRows;
    programs = programsRows;
    news = newsRows;
    galleries = galleriesRows;
    testimonials = testimonialsRows;
  } catch (error) {
    console.error("Failed to fetch data for homepage", error);
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      <Header />
      
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-primary-900">
        {settings.hero_background && !settings.hero_background.startsWith('/uploads/dummy/') ? (
          <div className="absolute inset-0">
            <ImageParallax src={settings.hero_background} alt="Hero Background" className="w-full h-full" />
            <div className="absolute inset-0 bg-primary-900/60 z-10"></div>
          </div>
        ) : (
          <div className="absolute inset-0">
            <ImageParallax src="/uploads/dummy/hero_bg.png" alt="Hero Background" className="w-full h-full" />
            <div className="absolute inset-0 bg-primary-900/60 z-10"></div>
          </div>
        )}
        <HeroParallax />
        
        <div className="relative z-20 container mx-auto px-4 md:px-6 text-center pt-20">
          <span className="inline-block py-1 px-3 rounded-full bg-primary-800 text-primary-200 text-sm font-semibold mb-6 tracking-wider uppercase fade-in">
            {settings.site_tagline || "Pendidikan Islam Terpadu"}
          </span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 leading-tight fade-in" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(settings.hero_title || "Membentuk Generasi <br /><span class=\"text-accent-default italic\">Qurani & Berprestasi</span>") }}>
          </h1>
          <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto mb-10 fade-in">
            {settings.hero_subtitle || "Yayasan Nuurul Muttaqiin menghadirkan pendidikan berkualitas dari jenjang LPQ hingga SMK dengan mengedepankan adab, ilmu, dan teknologi."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-in">
            <Link href="/ppdb" className="w-full sm:w-auto px-8 py-4 bg-accent-default text-primary-900 rounded-full font-bold text-lg hover:bg-accent-light transition shadow-xl hover:-translate-y-1">
              Daftar Sekarang
            </Link>
            <Link href="#tentang" className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-bold text-lg hover:bg-white/20 transition border border-white/20">
              Pelajari Lebih Lanjut
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-[calc(100%+1.3px)] h-[70px] md:h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.93,121.9,198.8,111.45,241.65,104.81,283.47,82.46,321.39,56.44Z" className="fill-gray-50"></path>
          </svg>
        </div>
      </section>

      {/* TENTANG SECTION */}
      <section id="tentang" className="py-16 md:py-24 bg-gray-50 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-6">Sejarah & Visi Kami</h2>
              <div className="w-20 h-1.5 bg-primary-500 mb-8 rounded-full"></div>
              
              {settings.profile_history ? (
                <div className="text-gray-600 text-lg leading-relaxed mb-8 prose prose-lg" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(settings.profile_history) }} />
              ) : (
                <>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    Berdiri sejak tahun 2005, Yayasan Nuurul Muttaqiin telah berkomitmen untuk memberikan pendidikan Islam yang komprehensif. Kami percaya bahwa pendidikan tidak hanya tentang akademis, melainkan pembentukan karakter yang kuat.
                  </p>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    Dengan fasilitas modern dan tenaga pengajar profesional, kami mendidik ribuan siswa setiap tahunnya untuk siap menghadapi masa depan tanpa meninggalkan nilai-nilai Islam.
                  </p>
                </>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-4xl font-bold text-primary-600 mb-2">{units.length || 5}</div>
                  <div className="text-sm text-gray-500 font-medium">Unit Sekolah</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-600 mb-2">{settings.stat_students || "1.2K+"}</div>
                  <div className="text-sm text-gray-500 font-medium">Siswa Aktif</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-600 mb-2">{settings.stat_founded || "2005"}</div>
                  <div className="text-sm text-gray-500 font-medium">Tahun Berdiri</div>
                </div>
              </div>
            </div>
            <div className="relative">
              {/* Image Placeholder or Uploaded Image */}
              <div className="aspect-[4/5] rounded-2xl bg-gray-200 overflow-hidden relative shadow-2xl">
                {settings.profile_image && !settings.profile_image.startsWith('/uploads/dummy/') ? (
                  <img src={settings.profile_image} alt="Gedung Yayasan" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <img src="/uploads/dummy/about_img.png" alt="Gedung Yayasan" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                )}
              </div>
              {/* Decorative Card */}
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
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">Layanan Pendidikan</h2>
            <p className="text-gray-600 text-lg">Jenjang pendidikan terpadu dan berkelanjutan dari usia dini hingga kejuruan.</p>
          </div>

          {units.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
              {units.map((unit) => (
                <Link key={unit.id} href={`/unit/${unit.slug}`} className="group block h-full">
                  <TiltCard className="bg-gray-50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100 h-full flex flex-col">
                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                      {unit.image_url ? (
                         <img src={unit.image_url} alt={unit.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                          [Foto {unit.name}]
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/20 transition-colors duration-300"></div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-bold text-xl text-gray-900 mb-2">{unit.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                        {unit.description}
                      </p>
                      <span className="text-primary-600 font-semibold text-sm group-hover:text-primary-700 flex items-center gap-1">
                        Detail Unit <span className="text-lg leading-none">&rarr;</span>
                      </span>
                    </div>
                  </TiltCard>
                </Link>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center text-gray-500 py-12">Belum ada data unit sekolah.</div>
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
      <TestimonialsSection data={testimonials} />

      <Footer />
    </main>
  );
}
