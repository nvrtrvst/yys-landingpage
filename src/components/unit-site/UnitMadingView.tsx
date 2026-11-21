import Link from "next/link";
import type { UnitMadingPost } from "./unit-site-data";

function plainText(html: string | null): string {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function UnitMadingView({ slug, posts }: { slug: string; posts: UnitMadingPost[] }) {
  if (posts.length === 0) {
    return <p style={{ color: "#66756b" }}>Belum ada tulisan siswa atau guru untuk unit ini.</p>;
  }
  return (
    <div className="unit-site-mading-grid">
      {posts.map((post) => (
        <Link key={post.id} href={`/${slug}/mading/${post.slug}`} className="unit-site-card" style={{ color: "inherit" }}>
          {post.cover_image && !post.cover_image.startsWith("/uploads/dummy/") ? (
            <img src={post.cover_image} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} loading="lazy" decoding="async" />
          ) : null}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--unit-primary)" }}>{post.category_name || "Tulisan"}</div>
          <h2 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: 18, margin: "6px 0 8px" }}>{post.title}</h2>
          {post.excerpt ? <p style={{ margin: 0, lineHeight: 1.6, color: "#4a5a4f" }}>{plainText(post.excerpt)}</p> : null}
          <div style={{ fontSize: 12, color: "#66756b", marginTop: 10 }}>
            {post.author_name || ""}
            {post.published_at || post.created_at ? ` · ${new Date(post.published_at || post.created_at || "").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : ""}
          </div>
        </Link>
      ))}
    </div>
  );
}
