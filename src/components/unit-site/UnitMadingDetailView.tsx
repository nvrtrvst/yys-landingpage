import DOMPurify from "isomorphic-dompurify";
import type { UnitMadingPost } from "./unit-site-data";

export function UnitMadingDetailView({ post }: { post: UnitMadingPost }) {
  const date = post.published_at || post.created_at;
  return (
    <article>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--unit-primary)", marginBottom: 12 }}>
        {post.category_name || "Tulisan"}{post.author_name ? ` · ${post.author_name}` : ""}
      </div>
      <h1 style={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: "clamp(1.75rem, 5vw, 2.5rem)", lineHeight: 1.2, color: "var(--unit-primary)", margin: "0 0 24px" }}>{post.title}</h1>
      {date ? <div style={{ fontSize: 13, color: "#66756b", marginBottom: 24 }}>{new Date(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div> : null}
      {post.cover_image && !post.cover_image.startsWith("/uploads/dummy/") ? (
        <img src={post.cover_image} alt={post.title} style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 16, marginBottom: 28 }} decoding="async" />
      ) : null}
      <div className="unit-site-profil unit-site-answer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || "") }} />
    </article>
  );
}
