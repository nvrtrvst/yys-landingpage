import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { unitSiteFontClass } from "./unit-site-fonts";
import { safeUnitColor, unitSiteStyles } from "./unit-site-styles";
import { foundationUrl } from "@/lib/unit-sites";
import type { UnitSiteUnit } from "./unit-site-data";

function waHref(number: string | null, message: string | null): string | null {
  if (!number) return null;
  let phone = number.replace(/\D/g, "");
  if (!phone) return null;
  if (phone.startsWith("0")) phone = `62${phone.slice(1)}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message || "Halo, saya ingin bertanya.")}`;
}

export function UnitListingPage({ unit, title, children }: { unit: UnitSiteUnit; title: string; children: ReactNode }) {
  const primary = safeUnitColor(unit.primary_color, "#14532d");
  const secondary = safeUnitColor(unit.secondary_color, "#fef08a");
  const whatsapp = waHref(unit.wa_number, unit.wa_message);
  const backHref = `/${unit.slug}`;
  const rootStyle = {
    "--unit-primary": primary,
    "--unit-secondary": secondary,
    fontFamily: "var(--font-nunito), sans-serif",
  } as CSSProperties;

  return (
    <div className={`unit-site ${unitSiteFontClass}`} style={rootStyle}>
      <header className="unit-site-header">
        <div className="unit-site-header-inner">
          <Link href={backHref} style={{ color: "#fff", fontWeight: 700 }}>{unit.name}</Link>
          <Link href={backHref} style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Kembali ke situs unit</Link>
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
