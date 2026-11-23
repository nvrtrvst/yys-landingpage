import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import type { CSSProperties } from "react";
import { unitSiteFontClass } from "./unit-site-fonts";
import { safeUnitColor, unitSiteStyles } from "./unit-site-styles";
import { foundationUrl } from "@/lib/unit-sites";
import { parseCarouselImages, safeMapEmbedUrl, youtubeEmbedUrl, youtubeWatchUrl } from "@/lib/unit-media";
import { UnitCarousel } from "./UnitCarousel";
import type { UnitSiteData } from "./unit-site-data";

function isRealImage(url: string | null | undefined): url is string {
  return !!url && !url.startsWith("/uploads/dummy/");
}

function formatDate(value: string | null): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function dateBadge(value: string): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }).toUpperCase();
  } catch {
    return "";
  }
}

function plainText(html: string | null): string {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function waHref(number: string | null, message: string | null): string | null {
  if (!number) return null;
  let phone = number.replace(/\D/g, "");
  if (!phone) return null;
  if (phone.startsWith("0")) phone = `62${phone.slice(1)}`;
  const text = encodeURIComponent(message || "Halo, saya ingin bertanya.");
  return `https://wa.me/${phone}?text=${text}`;
}

export function UnitSite({ unit, news, events, testimonials, galleries, programs, faqs }: UnitSiteData) {
  const primary = safeUnitColor(unit.primary_color, "#14532d");
  const secondary = safeUnitColor(unit.secondary_color, "#fef08a");
  const heroImage = isRealImage(unit.image_url) ? unit.image_url : null;
  const heroBackground = isRealImage(unit.hero_background) ? unit.hero_background : null;
  const programBackground = isRealImage(unit.programs_background) ? unit.programs_background : null;
  const logo = isRealImage(unit.logo_url) ? unit.logo_url : null;
  const profileImage = isRealImage(unit.profile_image) ? unit.profile_image : null;
  const historyHtml = unit.history_html ? DOMPurify.sanitize(unit.history_html) : "";
  const contentHtml = unit.content && !/lorem ipsum/i.test(unit.content) ? DOMPurify.sanitize(unit.content) : "";
  const missionLines = (unit.mission || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const stats = [
    { value: unit.stat_students, label: "Siswa Aktif" },
    { value: unit.stat_founded, label: "Tahun Berdiri" },
  ].filter((item) => item.value && item.value !== "0");
  const hasProfile = !!(historyHtml || unit.vision || missionLines.length || profileImage || stats.length || contentHtml);
  const realGalleries = galleries.filter((item) => isRealImage(item.image_url));
  const carouselImages = parseCarouselImages(unit.carousel_images);
  const videoEmbed = youtubeEmbedUrl(unit.youtube_url);
  const videoWatch = youtubeWatchUrl(unit.youtube_url);
  const mapEmbed = safeMapEmbedUrl(unit.map_embed_url, unit.address);
  const hasMedia = carouselImages.length > 0 || !!videoEmbed;
  const faqGroups = faqs.reduce<Record<string, typeof faqs>>((groups, item) => {
    const key = item.category?.trim() || "Umum";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
  const galleryHref = `/${unit.slug}/galeri`;
  const socials = [
    { label: "Instagram", url: unit.social_instagram },
    { label: "Facebook", url: unit.social_facebook },
    { label: "YouTube", url: unit.social_youtube },
  ].filter((item) => item.url && /^https?:\/\//.test(item.url));
  const whatsapp = waHref(unit.wa_number, unit.wa_message);
  const ppdbHref = `/ppdb?unit=${unit.slug}`;
  const newsHref = `/${unit.slug}/berita`;
  const agendaHref = `/${unit.slug}/agenda`;
  const foundation = foundationUrl();
  const navItems = [
    { label: "Beranda", href: "#beranda" },
    ...(hasProfile ? [{ label: "Profil", href: "#profil" }] : []),
    ...(programs.length ? [{ label: "Program", href: "#program" }] : []),
    { label: "Berita", href: "#berita" },
    { label: "Agenda", href: "#agenda" },
    ...(realGalleries.length ? [{ label: "Galeri", href: "#galeri" }] : []),
    ...(hasMedia ? [{ label: "Media", href: "#media" }] : []),
    ...(faqs.length ? [{ label: "Tanya Jawab", href: "#tanya-jawab" }] : []),
  ];
  const rootStyle = {
    "--unit-primary": primary,
    "--unit-secondary": secondary,
    fontFamily: "var(--font-nunito), sans-serif",
  } as CSSProperties;

  return (
    <div className={`unit-site ${unitSiteFontClass}`} style={rootStyle}>
      <header className="unit-site-header">
        <div className="unit-site-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {logo ? <img src={logo} alt="" style={{ width: 42, height: 42, objectFit: "contain" }} /> : null}
            <div>
              <div style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>{unit.name}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Yayasan Nuurul Muttaqiin</div>
            </div>
          </div>
          <nav className="unit-site-nav">
            {navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
            <Link href={ppdbHref} className="unit-site-cta">Daftar PPDB</Link>
          </nav>
          <details className="unit-site-nav-mobile">
            <summary className="unit-site-menu-button">Menu</summary>
            <div className="unit-site-menu">
              {navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
              <Link href={ppdbHref} className="unit-site-cta">Daftar PPDB</Link>
            </div>
          </details>
        </div>
      </header>

      <section id="beranda" className="unit-site-hero">
        {heroBackground ? <img src={heroBackground} alt="" className="unit-site-hero-bg" /> : null}
        <div className="unit-site-hero-inner">
          <div className={heroImage ? "unit-site-hero-grid" : ""}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.85 }}>Unit Pendidikan</div>
              <h1 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: "clamp(2rem, 6vw, 3.25rem)", lineHeight: 1.1, margin: "16px 0" }}>
                {unit.tagline || unit.name}
              </h1>
              {unit.description ? <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)", lineHeight: 1.6, margin: "0 0 28px", color: "rgba(255,255,255,0.9)" }}>{unit.description}</p> : null}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link href={ppdbHref} className="unit-site-cta">Daftar PPDB</Link>
                {hasProfile ? <a href="#profil" className="unit-site-cta-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.6)" }}>Profil Unit</a> : null}
              </div>
            </div>
            {heroImage ? (
              <div>
                <img src={heroImage} alt={unit.name} style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 16 }} loading="eager" decoding="async" />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {hasProfile ? (
        <section id="profil" className="unit-site-section" style={{ background: "#f3f7f2" }}>
          <div className="unit-site-container">
            <div className="unit-site-grid" style={{ alignItems: "start" }}>
              <div className="unit-site-profil">
                <h2>Profil {unit.name}</h2>
                {profileImage ? <img src={profileImage} alt={unit.name} style={{ width: "100%", borderRadius: 14, marginBottom: 24 }} loading="lazy" decoding="async" /> : null}
                {historyHtml ? <div dangerouslySetInnerHTML={{ __html: historyHtml }} /> : null}
                {contentHtml ? <div dangerouslySetInnerHTML={{ __html: contentHtml }} /> : null}
                {unit.vision ? (
                  <figure style={{ margin: "28px 0", paddingLeft: 20, borderLeft: `3px solid ${primary}` }}>
                    <blockquote style={{ margin: 0, fontFamily: "var(--font-baloo), sans-serif", fontSize: "1.15rem", lineHeight: 1.5 }}>{unit.vision}</blockquote>
                    <figcaption style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: primary }}>Visi</figcaption>
                  </figure>
                ) : null}
                {missionLines.length ? (
                  <div style={{ marginTop: 28 }}>
                    <h3>Misi</h3>
                    <ol className="unit-site-profil" style={{ paddingLeft: 20 }}>
                      {missionLines.map((line) => <li key={line}>{line}</li>)}
                    </ol>
                  </div>
                ) : null}
              </div>
              {stats.length ? (
                <div className="unit-site-grid" style={{ gap: 16 }}>
                  {stats.map((item) => (
                    <div key={item.label} className="unit-site-card">
                      <div style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: 28, color: primary }}>{item.value}</div>
                      <div style={{ fontSize: 12, color: "#66756b", marginTop: 6 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {programs.length ? (
        <section id="program" className="unit-site-section" style={{ position: "relative", overflow: "hidden", background: primary, color: "#fff" }}>
          {programBackground ? <img src={programBackground} alt="" className="unit-site-hero-bg" /> : null}
          <div className="unit-site-container" style={{ position: "relative" }}>
            <h2 className="unit-site-h2" style={{ color: "#fff" }}>Program Unggulan</h2>
            <div className="unit-site-grid">
              {programs.map((item) => (
                <div key={item.id} className="unit-site-card">
                  {isRealImage(item.image_url) ? <img src={item.image_url} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} loading="lazy" decoding="async" /> : null}
                  <h3 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: 18, margin: "0 0 8px" }}>{item.title}</h3>
                  {item.description ? <p style={{ margin: 0, lineHeight: 1.6, color: "#4a5a4f" }}>{plainText(item.description)}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {realGalleries.length ? (
        <section id="galeri" className="unit-site-section">
          <div className="unit-site-container">
            <h2 className="unit-site-h2">Galeri Kegiatan</h2>
            <div className="unit-site-gallery-grid">
              {realGalleries.map((item) => (
                <a key={item.id} href={item.image_url || ""} target="_blank" rel="noopener noreferrer" style={{ borderRadius: 14, overflow: "hidden", background: "#e8efe8", display: "block" }}>
                  <img src={item.image_url || undefined} alt={item.title || "Kegiatan"} style={{ width: "100%", height: 180, objectFit: "cover" }} loading="lazy" decoding="async" />
                  {item.title || item.created_at ? (
                    <div style={{ padding: 12, fontSize: 13 }}>
                      <div style={{ fontWeight: 700 }}>{item.title || "Kegiatan"}</div>
                      {item.created_at ? <div style={{ color: "#66756b" }}>{formatDate(item.created_at)}</div> : null}
                    </div>
                  ) : null}
                </a>
              ))}
            </div>
            <Link href={galleryHref} style={{ color: primary, fontWeight: 700, display: "inline-flex", minHeight: 44, alignItems: "center", marginTop: 16 }}>Lihat galeri lengkap</Link>
          </div>
        </section>
      ) : null}

      {hasMedia ? (
        <section id="media" className="unit-site-section" style={{ background: "#f3f7f2" }}>
          <div className="unit-site-container">
            <h2 className="unit-site-h2">Media &amp; Video</h2>
            <div className="unit-site-media-grid">
              {carouselImages.length ? <div><UnitCarousel images={carouselImages} /></div> : null}
              {videoEmbed ? (
                <div>
                  <div className="unit-site-video">
                    <iframe src={videoEmbed} title={`Video ${unit.name}`} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="unsafe-url" allowFullScreen loading="lazy" />
                  </div>
                  {videoWatch ? (
                    <a href={videoWatch} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, marginTop: 10, color: primary, fontWeight: 700 }}>
                      Tonton di YouTube
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="unit-site-section">
        <div className="unit-site-container unit-site-grid unit-site-grid-2">
          <div id="berita">
            <h2 className="unit-site-h2">Berita Terbaru</h2>
            {news.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {news.map((item) => (
                  <Link key={item.id} href={`/${unit.slug}/berita/${item.slug}`} className="unit-site-card" style={{ color: "inherit" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      {isRealImage(item.image_url) ? <img src={item.image_url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10 }} loading="lazy" decoding="async" /> : null}
                      <div>
                        <div style={{ fontSize: 12, color: primary, fontWeight: 700 }}>{item.category || "Berita"}</div>
                        <div style={{ fontWeight: 700, marginTop: 2 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: "#66756b", marginTop: 4 }}>{formatDate(item.published_at || item.created_at)}</div>
                      </div>
                    </div>
                    {plainText(item.content) ? <p style={{ margin: "12px 0 0", color: "#4a5a4f", lineHeight: 1.5, fontSize: 14 }}>{plainText(item.content).slice(0, 160)}</p> : null}
                  </Link>
                ))}
                <Link href={newsHref} style={{ color: primary, fontWeight: 700 }}>Lihat semua berita</Link>
              </div>
            ) : (
              <p style={{ color: "#66756b", margin: 0 }}>Belum ada berita untuk unit ini.</p>
            )}
          </div>
          <div id="agenda">
            <h2 className="unit-site-h2">Agenda</h2>
            {events.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {events.map((item) => (
                  <div key={item.id} className="unit-site-card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span style={{ minWidth: 54, textAlign: "center", background: "#f3f7f2", color: primary, padding: "8px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                      {dateBadge(item.start_date)}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.title}</div>
                      {item.location ? <div style={{ fontSize: 12, color: "#66756b" }}>{item.location}</div> : null}
                    </div>
                  </div>
                ))}
                <Link href={agendaHref} style={{ color: primary, fontWeight: 700 }}>Lihat agenda lengkap</Link>
              </div>
            ) : (
              <p style={{ color: "#66756b", margin: 0 }}>Belum ada agenda mendatang untuk unit ini.</p>
            )}
          </div>
        </div>
      </section>

      {testimonials.length ? (
        <section className="unit-site-section" style={{ background: "#f3f7f2" }}>
          <div className="unit-site-container">
            <h2 className="unit-site-h2">Testimoni</h2>
            <div className="unit-site-grid">
              {testimonials.map((item) => (
                <div key={item.id} className="unit-site-card">
                  {isRealImage(item.image_url) ? <img src={item.image_url} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", marginBottom: 12 }} loading="lazy" decoding="async" /> : null}
                  <p style={{ margin: "0 0 12px", lineHeight: 1.6 }}>{`"${item.content}"`}</p>
                  <div style={{ fontWeight: 700, color: primary }}>{item.author_name}{item.role ? `, ${item.role}` : ""}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {faqs.length ? (
        <section id="tanya-jawab" className="unit-site-section unit-site-faq">
          <div className="unit-site-container">
            <h2 className="unit-site-h2">Tanya Jawab</h2>
            {Object.entries(faqGroups).map(([category, items]) => (
              <div key={category}>
                <h3>{category}</h3>
                {items.map((item) => (
                  <details key={item.id}>
                    <summary>{item.question}</summary>
                    <div className="unit-site-faq-answer unit-site-answer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.answer) }} />
                  </details>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="unit-site-section">
        <div className="unit-site-container" style={{ background: primary, color: "#fff", borderRadius: 18, padding: "28px 20px" }}>
          <h2 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: "clamp(1.4rem,4vw,1.9rem)", margin: "0 0 8px" }}>Penerimaan Peserta Didik Baru</h2>
          <p style={{ margin: "0 0 20px" }}>Daftarkan putra-putri Anda dan bergabung bersama kami.</p>
          <Link href={ppdbHref} className="unit-site-cta">Daftar PPDB</Link>
        </div>
      </section>

      <footer className="unit-site-footer">
        <div className="unit-site-container" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 20 }}>
          <div>
            <div style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 18 }}>{unit.name}</div>
            {unit.address ? <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{unit.address}</div> : null}
            {unit.phone ? <div style={{ fontSize: 14 }}>{unit.phone}</div> : null}
            {unit.contact_email ? <div style={{ fontSize: 14 }}>{unit.contact_email}</div> : null}
          </div>
          <div style={{ fontSize: 14 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {socials.map((item) => <a key={item.label} href={item.url || ""} target="_blank" rel="noopener noreferrer" style={{ color: secondary, fontWeight: 700 }}>{item.label}</a>)}
            </div>
            {mapEmbed ? (
              <details style={{ marginTop: 8 }}>
                <summary style={{ minHeight: 44, display: "flex", alignItems: "center", color: secondary, fontWeight: 700, cursor: "pointer" }}>Lokasi</summary>
                <div className="unit-site-map-video" style={{ marginTop: 8 }}>
                  <iframe src={mapEmbed} title={`Lokasi ${unit.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              </details>
            ) : null}
            <div className="unit-site-legal" style={{ marginTop: 8 }}>
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href={foundation}>Yayasan Nuurul Muttaqiin</a>
            </div>
          </div>
        </div>
      </footer>

      {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="unit-site-wa" aria-label="Hubungi via WhatsApp">WA</a> : null}
      <style>{unitSiteStyles}</style>
    </div>
  );
}
