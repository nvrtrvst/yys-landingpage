import Link from "next/link";
import { notFound } from "next/navigation";
import { UnitListingPage } from "@/components/unit-site/UnitListingPage";
import { getUnitNewsList } from "@/components/unit-site/unit-site-data";
import { generateUnitListingMetadata } from "@/components/unit-site/unit-site-metadata";
import { unitNewsUrl, unitUrl } from "@/lib/unit-sites";

export const revalidate = 60;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return generateUnitListingMetadata("smk", "berita", Math.max(1, Number(page) || 1));
}

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const data = await getUnitNewsList("smk", parseInt(page || "1", 10)).catch(() => null);
  if (!data) notFound();
  return (
    <UnitListingPage unit={data.unit} title={`Berita ${data.unit.name}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.news.map((item) => (
          <Link key={item.id} href={unitNewsUrl("smk", item.slug)} className="unit-site-card" style={{ color: "inherit" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--unit-primary)" }}>{item.category || "Berita"}</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: "#66756b", marginTop: 6 }}>
              {item.published_at ? new Date(item.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""}
            </div>
          </Link>
        ))}
        {data.news.length === 0 ? <p style={{ color: "#66756b" }}>Belum ada berita untuk unit ini.</p> : null}
      </div>
      {data.totalPages > 1 ? (
        <nav style={{ display: "flex", gap: 12, marginTop: 24 }}>
          {Array.from({ length: data.totalPages }, (_, index) => index + 1).map((number) => (
            <Link key={number} href={`${unitUrl("smk", "/berita")}?page=${number}`} style={{ fontWeight: number === data.page ? 700 : 400 }}>{number}</Link>
          ))}
        </nav>
      ) : null}
    </UnitListingPage>
  );
}
