import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";

interface UnitRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  content: string | null;
  tagline: string | null;
}

interface NewsRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string | null;
  content: string | null;
}

interface EventRow extends RowDataPacket {
  id: number;
  title: string;
  start_date: string;
  image_url: string | null;
}

interface TestimonialRow extends RowDataPacket {
  id: number;
  author_name: string;
  role: string | null;
  content: string;
  image_url: string | null;
}

interface GalleryRow extends RowDataPacket {
  id: number;
  title: string | null;
  image_url: string | null;
}

const PRIMARY = "#1F6B3A";
const ACCENT = "#F7B500";

function isRealImage(url: string | null | undefined): url is string {
  return !!url && !url.startsWith("/uploads/dummy/");
}

function formatDate(value: string | null): string {
  if (!value) return "[TANGGAL]";
  try {
    return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "[TANGGAL]";
  }
}

function eventDateBadge(value: string): string {
  if (!value) return "[TGL]";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }).toUpperCase();
  } catch {
    return "[TGL]";
  }
}

export const revalidate = 60;

export default async function SDHomePage() {
  let unit: UnitRow | null = null;
  let news: NewsRow[] = [];
  let events: EventRow[] = [];
  let testimonials: TestimonialRow[] = [];
  let galleries: GalleryRow[] = [];

  try {
    const [unitRows] = await pool.execute<UnitRow[]>(
      "SELECT id, name, slug, image_url, description, address, phone, content, tagline FROM units WHERE slug = 'sd' AND status = 'active'"
    );
    unit = unitRows[0] ?? null;

    const [newsRows, eventRows, testimonialRows, galleryRows] = await Promise.all([
      pool.execute<NewsRow[]>(
        "SELECT id, title, slug, image_url, category, published_at, created_at, content FROM news WHERE status = 'published' AND unit_id = ? ORDER BY published_at DESC LIMIT 3",
        [unit?.id ?? 0]
      ),
      pool.execute<EventRow[]>(
        "SELECT id, title, start_date, image_url FROM events WHERE start_date >= CURRENT_DATE() AND unit_id = ? ORDER BY start_date ASC LIMIT 3",
        [unit?.id ?? 0]
      ),
      pool.execute<TestimonialRow[]>(
        "SELECT id, author_name, role, content, image_url FROM testimonials WHERE is_active = 1 AND unit_id = ? ORDER BY order_index ASC LIMIT 1",
        [unit?.id ?? 0]
      ),
      pool.execute<GalleryRow[]>(
        "SELECT id, title, image_url FROM galleries WHERE unit_id = ? ORDER BY created_at DESC LIMIT 4",
        [unit?.id ?? 0]
      ),
    ]);
    news = newsRows[0];
    events = eventRows[0];
    testimonials = testimonialRows[0];
    galleries = galleryRows[0];
  } catch (error) {
    console.error("Failed to fetch SD data", error);
  }

  const address = unit?.address && unit.address.trim().length >= 12 ? unit.address : "Jl. Raya Cisurupan no 154, Kec. Cisurupan, Kab. Garut, Jawa Barat";
  const phone = unit?.phone && unit.phone.trim().length >= 6 ? unit.phone : "0262-577358";

  const galleryColors = ["#FFE9A8", "#DFF1FB", "#FFD9B8", "#FFFFFF"];
  const galleryTextColors = ["#7a5a00", "#2c5a73", "#8a4a10", PRIMARY];

  return (
    <div style={{ fontFamily: "var(--font-nunito), 'Nunito', sans-serif", color: "#24392c", background: "#fffdf6", width: "100%" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: PRIMARY, color: "#fff", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", color: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif", fontWeight: 700, fontSize: 13 }}>
            LOGO
          </div>
          <div style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.1 }}>
            SD Nuurul Muttaqiin
            <div style={{ fontFamily: "var(--font-nunito), 'Nunito', sans-serif", fontWeight: 400, fontSize: 12 }}>
              Di bawah naungan Yayasan Nuurul Muttaqiin
            </div>
          </div>
        </div>
        <nav className="nav-desktop" style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "center", fontWeight: 600, fontSize: 15 }}>
          <a href="#" style={{ color: "#fff" }}>Beranda</a>
          <a href="#" style={{ color: "#fff" }}>Profil</a>
          <a href="#" style={{ color: "#fff" }}>Program</a>
          <a href="#" style={{ color: "#fff" }}>Dunia Siswa</a>
          <a href="#" style={{ color: "#fff" }}>Berita</a>
          <a href="#" style={{ color: "#fff" }}>Agenda</a>
          <Link href="/ppdb?unit=sd" style={{ background: ACCENT, color: "#1b3a26", padding: "10px 20px", borderRadius: 999, fontWeight: 700 }}>
            Daftar PPDB
          </Link>
        </nav>
        <details className="nav-mobile" style={{ position: "relative" }}>
          <summary style={{ background: ACCENT, color: "#1b3a26", padding: "10px 20px", borderRadius: 999, fontWeight: 700, cursor: "pointer", listStyle: "none" }}>
            Menu
          </summary>
          <div style={{ position: "absolute", left: 0, right: 0, top: "100%", background: PRIMARY, padding: "8px 48px 20px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "0 12px 24px rgba(0,0,0,.18)" }}>
            <a href="#" style={{ color: "#fff", padding: "12px 0", fontWeight: 600 }}>Beranda</a>
            <a href="#" style={{ color: "#fff", padding: "12px 0", fontWeight: 600 }}>Profil</a>
            <a href="#" style={{ color: "#fff", padding: "12px 0", fontWeight: 600 }}>Program</a>
            <a href="#" style={{ color: "#fff", padding: "12px 0", fontWeight: 600 }}>Dunia Siswa</a>
            <a href="#" style={{ color: "#fff", padding: "12px 0", fontWeight: 600 }}>Berita</a>
            <a href="#" style={{ color: "#fff", padding: "12px 0", fontWeight: 600 }}>Agenda</a>
            <Link href="/ppdb?unit=sd" style={{ background: ACCENT, color: "#1b3a26", padding: "12px 20px", borderRadius: 999, fontWeight: 700, textAlign: "center", marginTop: 8 }}>
              Daftar PPDB
            </Link>
          </div>
        </details>
      </header>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-block", background: "#E4F3E7", color: PRIMARY, fontWeight: 700, fontSize: 14, padding: "6px 16px", borderRadius: 999 }}>
            Akreditasi A · Sekolah Dasar Islam Terpadu
          </div>
          <h1 style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif", fontSize: 52, lineHeight: 1.08, margin: "18px 0 14px", color: PRIMARY }}>
            Tumbuh Qurani, Berilmu, dan Berakhlak Mulia
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, margin: "0 0 26px", color: "#4a5a4f" }}>
            Sekolah dasar yang mengedepankan adab dan ilmu, dengan pembiasaan tahfidz dan lingkungan bilingual Arab–Inggris.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Link href="/ppdb?unit=sd" style={{ background: PRIMARY, color: "#fff", padding: "14px 28px", borderRadius: 999, fontWeight: 700, fontSize: 16 }}>
              Daftar Sekarang
            </Link>
            <a href="#" style={{ background: "#fff", color: PRIMARY, border: `2px solid ${PRIMARY}`, padding: "12px 26px", borderRadius: 999, fontWeight: 700, fontSize: 16 }}>
              Kenali Sekolah Kami
            </a>
          </div>
        </div>
        <div style={{ position: "relative", minHeight: 340 }}>
          <div style={{ position: "absolute", right: 0, top: 0, width: 300, height: 300, borderRadius: "50%", background: "#FFE9A8" }} />
          <div style={{ position: "absolute", left: 10, bottom: 0, width: 150, height: 150, borderRadius: "40% 60% 55% 45%", background: "#BFE3C8" }} />
          <div style={{ position: "absolute", left: 40, right: 40, top: 30, bottom: 30, borderRadius: 32, background: "#DFF1FB", border: "3px dashed #7DB8D6", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, color: "#2c5a73", fontWeight: 700 }}>
            [FOTO SISWA / ILUSTRASI MASKOT]
          </div>
        </div>
      </section>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 48px 56px" }}>
        <h2 style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif", fontSize: 32, textAlign: "center", margin: "0 0 28px", color: PRIMARY }}>
          Keunggulan Kami
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {[
            { title: "Tahfidz Al-Quran", desc: "Pembiasaan menghafal Al-Quran dengan bimbingan guru yang sabar.", shape: "18px", bg: ACCENT },
            { title: "Lingkungan Bilingual", desc: "Bahasa Arab dan Inggris dibiasakan dalam percakapan sehari-hari.", shape: "50%", bg: "#7DB8D6" },
            { title: "Karakter dan Adab", desc: "Ibadah sunnah dan adab harian, selaras dengan budaya Sunda yang santun.", shape: "18px 4px 18px 4px", bg: "#F28C28" },
          ].map((k) => (
            <div key={k.title} style={{ background: "#fff", borderRadius: 24, padding: 28, border: "2px solid #E4F3E7" }}>
              <div style={{ width: 56, height: 56, borderRadius: k.shape, background: k.bg, marginBottom: 16 }} />
              <h3 style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif", margin: "0 0 8px", fontSize: 22 }}>{k.title}</h3>
              <p style={{ margin: 0, lineHeight: 1.55, color: "#4a5a4f" }}>{k.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ background: "#E4F3E7", padding: "56px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif", fontSize: 32, margin: "0 0 6px", color: PRIMARY }}>Dunia Siswa</h2>
          <p style={{ margin: "0 0 24px", color: "#4a5a4f" }}>Karya, kegiatan, dan prestasi anak-anak kami.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
            {galleries.length > 0
              ? galleries.map((g, i) => (
                  <div key={g.id} style={{ height: 180, borderRadius: 24, overflow: "hidden", background: galleryColors[i % galleryColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: galleryTextColors[i % galleryTextColors.length] }}>
                    {isRealImage(g.image_url) ? (
                      <img src={g.image_url} alt={g.title || "Kegiatan"} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" decoding="async" />
                    ) : (
                      `[${g.title || "FOTO KEGIATAN"}]`
                    )}
                  </div>
                ))
              : ["[FOTO KEGIATAN]", "[KARYA SISWA]", "[PRESTASI]", "[FOTO HAFALAN]"].map((label, i) => (
                  <div key={label} style={{ height: 180, borderRadius: 24, background: galleryColors[i], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: galleryTextColors[i] }}>
                    {label}
                  </div>
                ))}
          </div>
        </div>
      </section>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif", fontSize: 28, margin: "0 0 16px", color: PRIMARY }}>Berita Terbaru</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {news.length > 0
              ? news.map((n, i) => {
                  const colors = ["#DFF1FB", "#FFE9A8", "#FFD9B8"];
                  const textColors = ["#2c5a73", "#7a5a00", "#8a4a10"];
                  return (
                    <Link key={n.id} href={`/berita/${n.slug}`} style={{ display: "flex", gap: 16, alignItems: "center", background: "#fff", borderRadius: 20, padding: "14px 18px", border: "2px solid #E4F3E7", color: "inherit" }}>
                      <div style={{ minWidth: 84, height: 84, borderRadius: 16, background: colors[i % colors.length], color: textColors[i % textColors.length], fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {isRealImage(n.image_url) ? (
                          <img src={n.image_url} alt={n.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" decoding="async" />
                        ) : (
                          "[FOTO]"
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: "#55645a" }}>{formatDate(n.published_at || n.created_at)}</div>
                        <div style={{ fontWeight: 700, fontSize: 17 }}>{n.title}</div>
                      </div>
                    </Link>
                  );
                })
              : [0, 1, 2].map((i) => {
                  const colors = ["#DFF1FB", "#FFE9A8", "#FFD9B8"];
                  const textColors = ["#2c5a73", "#7a5a00", "#8a4a10"];
                  return (
                    <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", background: "#fff", borderRadius: 20, padding: "14px 18px", border: "2px solid #E4F3E7" }}>
                      <div style={{ minWidth: 84, height: 84, borderRadius: 16, background: colors[i], color: textColors[i], fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        [FOTO]
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: "#55645a" }}>[TANGGAL]</div>
                        <div style={{ fontWeight: 700, fontSize: 17 }}>[Judul berita dari CMS]</div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif", fontSize: 28, margin: "0 0 16px", color: PRIMARY }}>Agenda</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {events.length > 0
              ? events.map((e) => (
                  <div key={e.id} style={{ display: "flex", gap: 16, alignItems: "center", background: "#fff", borderRadius: 20, padding: "14px 22px", border: "2px solid #E4F3E7" }}>
                    <div style={{ minWidth: 56, height: 56, borderRadius: 16, background: ACCENT, color: "#1b3a26", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                      {eventDateBadge(e.start_date)}
                    </div>
                    <div style={{ fontWeight: 700 }}>{e.title}</div>
                  </div>
                ))
              : [0, 1, 2].map((i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", background: "#fff", borderRadius: 20, padding: "14px 22px", border: "2px solid #E4F3E7" }}>
                    <div style={{ minWidth: 56, height: 56, borderRadius: 16, background: ACCENT, color: "#1b3a26", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                      [TGL]
                    </div>
                    <div style={{ fontWeight: 700 }}>[Nama agenda dari CMS]</div>
                  </div>
                ))}
          </div>
        </div>
      </section>
      
      {testimonials.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 56px" }}>
          <div style={{ background: "#FFF3CC", borderRadius: 24, padding: "28px 32px" }}>
            <p style={{ margin: "0 0 10px", fontSize: 18, lineHeight: 1.6 }}>
              {`"${testimonials[0].content}"`}
            </p>
            <div style={{ fontWeight: 700, color: "#7a5a00" }}>
              {testimonials[0].author_name}, {testimonials[0].role || "orang tua siswa"}
            </div>
          </div>
        </section>
      )}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 56px" }}>
        <div style={{ background: PRIMARY, color: "#fff", borderRadius: 32, padding: "40px 48px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif", fontSize: 32, margin: "0 0 6px" }}>Penerimaan Peserta Didik Baru</h2>
            <p style={{ margin: 0, fontSize: 17 }}>Daftarkan putra-putri Anda dan bergabung bersama kami.</p>
          </div>
          <Link href="/ppdb?unit=sd" style={{ background: ACCENT, color: "#1b3a26", padding: "14px 30px", borderRadius: 999, fontWeight: 700, fontSize: 17 }}>
            Daftar PPDB
          </Link>
        </div>
      </section>
      <footer style={{ background: "#173d27", color: "#e4f3e7", padding: "36px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif", fontWeight: 700, fontSize: 20 }}>SD Nuurul Muttaqiin</div>
            <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.6 }}>
              {address}
              <br />
              {phone}
            </div>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.8 }}>
            <Link href="/" style={{ color: ACCENT, fontWeight: 700 }}>Kembali ke Yayasan Nuurul Muttaqiin</Link>
            <br />
            © 2026 Yayasan Nuurul Muttaqiin
          </div>
        </div>
      </footer>
      <div style={{ position: "sticky", bottom: 20, height: 0, display: "flex", justifyContent: "flex-end", paddingRight: 24 }}>
        <a href="#" style={{ position: "relative", top: -64, background: ACCENT, color: "#1b3a26", padding: "14px 22px", borderRadius: 999, fontWeight: 700, boxShadow: "0 8px 20px rgba(0,0,0,.25)" }}>
          Tanya via WhatsApp
        </a>
      </div>
      <style>{`
        @media (max-width: 820px) { .nav-desktop { display: none !important; } .nav-mobile { display: block !important; } }
        .nav-mobile { display: none; }
        a { text-decoration: none; }
      `}</style>
    </div>
  );
}