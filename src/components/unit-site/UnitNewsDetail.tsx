import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import type { CSSProperties } from "react";
import { unitSiteFontClass } from "./unit-site-fonts";
import { safeUnitColor, unitSiteStyles } from "./unit-site-styles";
import { foundationUrl } from "@/lib/unit-sites";
import type { UnitNewsDetailData } from "./unit-site-data";

function isRealImage(url: string | null | undefined): url is string {
  return !!url && !url.startsWith("/uploads/dummy/");
}

function formatDate(value: string | null): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export function UnitNewsDetail({ unit, news }: UnitNewsDetailData) {
  const primary = safeUnitColor(unit.primary_color, "#14532d");
  const secondary = safeUnitColor(unit.secondary_color, "#fef08a");
  const image = isRealImage(news.image_url) ? news.image_url : null;
  const contentHtml = DOMPurify.sanitize(news.content || "");
  const backHref = `/${unit.slug}`;
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
      <header style={{ background: "var(--unit-primary)", color: "#fff", padding: "18px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 19 }}>{unit.name}</div>
          <Link href={backHref} style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Kembali ke situs unit</Link>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "56px 48px" }}>
        <article>
          {formatDate(news.published_at || news.created_at) ? (
            <div style={{ color: "var(--unit-primary)", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              {formatDate(news.published_at || news.created_at)}
            </div>
          ) : null}
          <h1 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: 1.2, color: "var(--unit-primary)", margin: "0 0 28px" }}>
            {news.title}
          </h1>
          {image ? (
            <img src={image} alt={news.title} style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 16, marginBottom: 32 }} decoding="async" />
          ) : null}
          <div className="unit-site-profil" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #e2e8e2" }}>
          <Link href={backHref} style={{ display: "inline-block", background: "var(--unit-secondary)", color: "#1b2b1f", padding: "12px 22px", borderRadius: 10, fontWeight: 700 }}>
            Kembali ke {unit.name}
          </Link>
        </div>
      </main>

      <footer style={{ background: "#173d27", color: "#e4f3e7", padding: "28px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, fontSize: 14 }}>
          <div style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700 }}>{unit.name}</div>
          <a href={foundationUrl()} style={{ color: "var(--unit-secondary)", fontWeight: 700 }}>Yayasan Nuurul Muttaqiin</a>
        </div>
      </footer>

      <style>{unitSiteStyles}</style>
    </div>
  );
}
