import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { UnitMobileMenu } from "./UnitMobileMenu";
import { unitSiteFontClass } from "./unit-site-fonts";
import { contrastInk, DEFAULT_UNIT_PRIMARY, DEFAULT_UNIT_SECONDARY } from "./unit-site-color";
import { safeUnitColor, unitSiteStyles } from "./unit-site-styles";
import { foundationUrl, unitUrl } from "@/lib/unit-sites";
import { unitLogoUrl } from "@/lib/unit-logo";
import { getSettings } from "@/lib/db";
import type { UnitSiteUnit } from "./unit-site-data";

function waHref(number: string | null, message: string | null): string | null {
  if (!number) return null;
  let phone = number.replace(/\D/g, "");
  if (!phone) return null;
  if (phone.startsWith("0")) phone = `62${phone.slice(1)}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message || "Halo, saya ingin bertanya.")}`;
}

export async function UnitListingPage({ unit, title, children }: { unit: UnitSiteUnit; title: string; children: ReactNode }) {
  const primary = safeUnitColor(unit.primary_color, DEFAULT_UNIT_PRIMARY);
  const secondary = safeUnitColor(unit.secondary_color, DEFAULT_UNIT_SECONDARY);
  const ink = contrastInk(secondary);
  const onPrimary = contrastInk(primary);
  const whatsapp = waHref(unit.wa_number, unit.wa_message);
  const logo = unitLogoUrl(unit, (await getSettings()).site_logo || null);
  const backHref = unitUrl(unit.slug);
  const ppdbHref = `/ppdb?unit=${unit.slug}`;
  const navItems = [
    { label: "Beranda", href: backHref },
    { label: "Berita", href: unitUrl(unit.slug, "/berita") },
    { label: "Agenda", href: unitUrl(unit.slug, "/agenda") },
    { label: "Galeri", href: unitUrl(unit.slug, "/galeri") },
  ];
  const rootStyle = {
    "--unit-primary": primary,
    "--unit-secondary": secondary,
    "--unit-ink": ink,
    "--unit-on-primary": onPrimary,
    fontFamily: "var(--font-nunito), sans-serif",
  } as CSSProperties;

  return (
    <div className={`unit-site ${unitSiteFontClass}`} style={rootStyle}>
      <header className="unit-site-header">
        <div className="unit-site-header-inner">
          <Link href={backHref} style={{ color: onPrimary, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 10 }}>
            <img src={logo} alt="" style={{ height: 36, width: "auto", maxWidth: 120, objectFit: "contain" }} />
            {unit.name}
          </Link>
          <nav className="unit-site-nav">
            {navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
            <Link href={ppdbHref} className="unit-site-cta">Daftar PPDB</Link>
          </nav>
          <UnitMobileMenu items={navItems} ctaHref={ppdbHref} />
        </div>
      </header>
      <main className="unit-site-section">
        <div className="unit-site-container" style={{ maxWidth: 900 }}>
          <h1 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: "clamp(1.75rem,5vw,2.5rem)", color: primary, margin: "0 0 28px" }}>{title}</h1>
          {children}
        </div>
      </main>
      <footer className="unit-site-footer">
        <div className="unit-site-container unit-site-legal" style={{ fontSize: 14 }}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href={foundationUrl()}>Yayasan Nuurul Muttaqiin</Link>
        </div>
      </footer>
      {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="unit-site-wa" aria-label="Hubungi via WhatsApp">WA</a> : null}
      <style>{unitSiteStyles}</style>
    </div>
  );
}
