import type { UnitSiteGallery } from "./unit-site-data";

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function UnitGalleryView({ galleries }: { galleries: UnitSiteGallery[] }) {
  if (galleries.length === 0) {
    return <p style={{ color: "#66756b" }}>Belum ada foto kegiatan untuk unit ini.</p>;
  }
  return (
    <div className="unit-site-gallery-grid">
      {galleries.map((item) => (
        <a key={item.id} href={item.image_url || ""} target="_blank" rel="noopener noreferrer" style={{ borderRadius: 14, overflow: "hidden", background: "#e8efe8", display: "block" }}>
          <img src={item.image_url || undefined} alt={item.title || "Kegiatan"} style={{ width: "100%", height: 180, objectFit: "cover" }} loading="lazy" decoding="async" />
          {item.title || item.created_at ? (
            <div style={{ padding: 12, fontSize: 13 }}>
              <div style={{ fontWeight: 700 }}>{item.title || "Kegiatan"}</div>
              {formatDate(item.created_at) ? <div style={{ color: "#66756b" }}>{formatDate(item.created_at)}</div> : null}
            </div>
          ) : null}
        </a>
      ))}
    </div>
  );
}
