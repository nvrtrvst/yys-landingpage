import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import type { CSSProperties } from "react";
import { unitSiteFontClass } from "./unit-site-fonts";
import { safeUnitColor, unitSiteStyles } from "./unit-site-styles";
import { foundationUrl } from "@/lib/unit-sites";
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

function eventDateBadge(value: string): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }).toUpperCase();
  } catch {
    return "";
  }
}

export function UnitSite({ unit, news, events, testimonials, galleries }: UnitSiteData) {
  const primary = safeUnitColor(unit.primary_color, "#14532d");
  const secondary = safeUnitColor(unit.secondary_color, "#fef08a");
  const heroImage = isRealImage(unit.image_url) ? unit.image_url : null;
  const logo = isRealImage(unit.logo_url) ? unit.logo_url : null;
  const contentHtml = unit.content && !/lorem ipsum/i.test(unit.content)
    ? DOMPurify.sanitize(unit.content)
    : "";
  const realGalleries = galleries.filter((item) => isRealImage(item.image_url));
  const ppdbHref = `/ppdb?unit=${unit.slug}`;
  const foundation = foundationUrl();
  const navItems = [
    { label: "Beranda", href: "#beranda" },
    ...(contentHtml ? [{ label: "Profil", href: "#profil" }] : []),
    ...(news.length ? [{ label: "Berita", href: "#berita" }] : []),
    ...(events.length ? [{ label: "Agenda", href: "#agenda" }] : []),
    ...(realGalleries.length ? [{ label: "Galeri", href: "#galeri" }] : []),
  ];
  const rootStyle = {
    "--unit-primary": primary,
    "--unit-secondary": secondary,
    fontFamily: "var(--font-nunito), sans-serif",
    color: "#24392c",
    background: "#fffdf8",
    width: "100%",
  } as CSSProperties;

  return (
    <div className={`unit-site ${unitSiteFontClass}`} style={rootStyle}>
      <header className="unit-site-header" style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--unit-primary)", color: "#fff" }}>
        <div className="unit-site-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {logo ? <img src={logo} alt="" style={{ width: 42, height: 42, objectFit: "contain" }} /> : null}
            <div>
              <div style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 19, lineHeight: 1.1 }}>{unit.name}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Di bawah naungan Yayasan Nuurul Muttaqiin</div>
            </div>
          </div>
          <nav className="unit-site-nav" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20, fontWeight: 600, fontSize: 14 }}>
            {navItems.map((item) => (
              <a key={item.href} href={item.href} style={{ color: "#fff" }}>{item.label}</a>
            ))}
            <Link href={ppdbHref} style={{ background: "var(--unit-secondary)", color: "#1b2b1f", padding: "10px 18px", borderRadius: 10, fontWeight: 700 }}>
              Daftar PPDB
            </Link>
          </nav>
          <details className="unit-site-nav-mobile" style={{ position: "relative" }}>
            <summary style={{ background: "var(--unit-secondary)", color: "#1b2b1f", padding: "10px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", listStyle: "none" }}>
              Menu
            </summary>
            <div style={{ position: "absolute", right: 0, top: "100%", background: "var(--unit-primary)", padding: 16, display: "flex", flexDirection: "column", gap: 6, minWidth: 180 }}>
              {navItems.map((item) => (
                <a key={item.href} href={item.href} style={{ color: "#fff", padding: "8px 0" }}>{item.label}</a>
              ))}
              <Link href={ppdbHref} style={{ color: "#fff", padding: "8px 0" }}>Daftar PPDB</Link>
            </div>
          </details>
        </div>
      </header>

      <section id="beranda" style={{ maxWidth: 1200, margin: "0 auto", padding: heroImage ? "64px 48px" : "88px 48px" }}>
        <div style={heroImage
          ? { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 56, alignItems: "center" }
          : { maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>Unit Pendidikan Yayasan Nuurul Muttaqiin</div>
            <h1 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.1, margin: "16px 0", color: "var(--unit-primary)" }}>
              {unit.tagline || unit.name}
            </h1>
            {unit.description ? <p style={{ fontSize: 17, lineHeight: 1.6, color: "#4a5a4f", margin: "0 0 28px" }}>{unit.description}</p> : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: heroImage ? "flex-start" : "center" }}>
              <Link href={ppdbHref} style={{ background: "var(--unit-secondary)", color: "#1b2b1f", padding: "13px 24px", borderRadius: 10, fontWeight: 700 }}>
                Daftar PPDB
              </Link>
              {contentHtml ? <a href="#profil" style={{ border: "1px solid var(--unit-primary)", color: "var(--unit-primary)", padding: "13px 24px", borderRadius: 10, fontWeight: 700 }}>Profil Unit</a> : null}
            </div>
          </div>
          {heroImage ? (
            <div>
              <img src={heroImage} alt={unit.name} style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 16 }} loading="eager" decoding="async" />
            </div>
          ) : null}
        </div>
      </section>

      {contentHtml ? (
        <section id="profil" style={{ background: "#f3f7f2", padding: "56px 48px" }}>
          <div className="unit-site-profil" style={{ maxWidth: 900, margin: "0 auto" }} dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </section>
      ) : null}

      {realGalleries.length ? (
        <section id="galeri" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 48px" }}>
          <h2 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: 28, color: "var(--unit-primary)", margin: "0 0 20px" }}>Galeri Kegiatan</h2>
          <div className="unit-site-gallery-grid">
            {realGalleries.map((item) => (
              <div key={item.id} style={{ height: 180, borderRadius: 14, overflow: "hidden", background: "#e8efe8" }}>
                <img src={item.image_url ?? undefined} alt={item.title || "Kegiatan"} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 48px 56px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48 }}>
        <div id="berita">
          <h2 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: 26, color: "var(--unit-primary)", margin: "0 0 18px" }}>Berita Terbaru</h2>
          {news.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {news.map((item) => (
                <Link key={item.id} href={`/${unit.slug}/berita/${item.slug}`} style={{ display: "flex", gap: 14, alignItems: "center", background: "#fff", border: "1px solid #e2e8e2", borderRadius: 14, padding: 14, color: "inherit" }}>
                  {isRealImage(item.image_url) ? (
                    <img src={item.image_url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10 }} loading="lazy" decoding="async" />
                  ) : null}
                  <div>
                    <div style={{ fontSize: 12, color: "#66756b" }}>{formatDate(item.published_at || item.created_at)}</div>
                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: "#66756b", margin: 0 }}>Belum ada berita untuk unit ini.</p>
          )}
        </div>
        <div id="agenda">
          <h2 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: 26, color: "var(--unit-primary)", margin: "0 0 18px" }}>Agenda</h2>
          {events.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {events.map((item) => (
                <div key={item.id} style={{ display: "flex", gap: 14, alignItems: "center", background: "#fff", border: "1px solid #e2e8e2", borderRadius: 14, padding: 14 }}>
                  <span style={{ minWidth: 54, textAlign: "center", background: "#f3f7f2", color: "var(--unit-primary)", padding: "8px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                    {eventDateBadge(item.start_date)}
                  </span>
                  <span style={{ fontWeight: 700 }}>{item.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#66756b", margin: 0 }}>Belum ada agenda mendatang untuk unit ini.</p>
          )}
        </div>
      </section>

      {testimonials[0] ? (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 56px" }}>
          <div style={{ background: "#f3f7f2", borderRadius: 16, padding: 28 }}>
            <p style={{ margin: "0 0 12px", fontSize: 17, lineHeight: 1.6 }}>{`"${testimonials[0].content}"`}</p>
            <div style={{ fontWeight: 700, color: "var(--unit-primary)" }}>
              {testimonials[0].author_name}{testimonials[0].role ? `, ${testimonials[0].role}` : ""}
            </div>
          </div>
        </section>
      ) : null}

      <section style={{ padding: "0 48px 56px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", background: "var(--unit-primary)", color: "#fff", borderRadius: 18, padding: "36px 40px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: 28, margin: "0 0 6px" }}>Penerimaan Peserta Didik Baru</h2>
            <p style={{ margin: 0 }}>Daftarkan putra-putri Anda dan bergabung bersama kami.</p>
          </div>
          <Link href={ppdbHref} style={{ background: "var(--unit-secondary)", color: "#1b2b1f", padding: "13px 26px", borderRadius: 10, fontWeight: 700 }}>
            Daftar PPDB
          </Link>
        </div>
      </section>

      <footer style={{ background: "#173d27", color: "#e4f3e7", padding: "36px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 20 }}>{unit.name}</div>
            {unit.address ? <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.6 }}>{unit.address}</div> : null}
            {unit.phone ? <div style={{ fontSize: 14 }}>{unit.phone}</div> : null}
          </div>
          <div style={{ fontSize: 14 }}>
            <a href={foundation} style={{ color: "var(--unit-secondary)", fontWeight: 700 }}>Kembali ke Yayasan Nuurul Muttaqiin</a>
            <div style={{ marginTop: 8 }}>© 2026 Yayasan Nuurul Muttaqiin</div>
          </div>
        </div>
      </footer>

      <style>{unitSiteStyles}</style>
    </div>
  );
}
