import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PPDBForm } from "./PPDBForm";
import { FAQSection, type FaqItem } from "@/components/FAQSection";
import pool, { getSettings } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";
import type { PPDBUnit } from "./types";
import { parsePpdbConfig, type PpdbConfig } from "@/lib/ppdb-config";
import type { Metadata } from "next";
import { foundationUrl } from "@/lib/unit-sites";
import { serializeJsonLd } from "@/lib/json-ld";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const config = parsePpdbConfig((await getSettings()).ppdb_config);
  const year = config?.academic_year;
  const title = year ? `Penerimaan Peserta Didik Baru ${year}` : "Penerimaan Peserta Didik Baru";
  const description = "Pendaftaran siswa baru TK, SD, SMP, SMK, dan LPQ Yayasan Nuurul Muttaqiin. Isi formulir online dan pantau status pendaftaran.";
  return {
    title,
    description,
    alternates: { canonical: `${foundationUrl()}/ppdb` },
    openGraph: { type: "website", title, description, url: `${foundationUrl()}/ppdb` },
  };
}

export default async function PPDBPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const requestedUnit = (await searchParams).unit?.toUpperCase() ?? "";
  let faqs: RowDataPacket[] = [];
  let units: PPDBUnit[] = [];
  const ppdbConfigs: Record<string, PpdbConfig | null> = {};
  const globalConfig = parsePpdbConfig((await getSettings()).ppdb_config);
  try {
    const [[faqRows], [unitRows]] = await Promise.all([
      pool.execute<RowDataPacket[]>(
        "SELECT id, question, answer, category FROM faqs ORDER BY order_index ASC, id ASC"
      ),
      pool.execute<RowDataPacket[]>(
        "SELECT id, name, slug, image_url, logo_url, description, ppdb_config FROM units WHERE status = 'active' ORDER BY order_index ASC"
      ),
    ]);
    faqs = faqRows;
    units = unitRows as PPDBUnit[];
    for (const row of unitRows) ppdbConfigs[String(row.slug)] = parsePpdbConfig(row.ppdb_config);
  } catch (error) {
    console.error("Failed to fetch PPDB page data", error);
  }

  const academicYear = globalConfig?.academic_year || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  const initialUnit = units.some((unit) => unit.slug.toUpperCase() === requestedUnit)
    ? requestedUnit
    : "";
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.slice(0, 20).map((item) => ({
      "@type": "Question",
      name: String(item.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: String(item.answer || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      },
    })),
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />
      <div className="bg-primary-900 pb-20">
        <Header />
        <div className="pt-32 pb-10 text-center text-white px-4">
          <h1 className="font-serif text-4xl font-bold mb-4">Penerimaan Peserta Didik Baru</h1>
          <p className="text-primary-100 max-w-2xl mx-auto mb-6">Tahun Ajaran {academicYear}. Silakan isi form di bawah ini dengan data yang sebenar-benarnya.</p>
          <Link href="/ppdb/status" className="inline-block px-6 py-2 border-2 border-primary-400 text-primary-50 rounded-lg hover:bg-primary-800 transition font-medium">
            Cek Status Pendaftaran &rarr;
          </Link>
        </div>
      </div>

      <div className="flex-1 -mt-16 mb-20 px-4 md:px-0">
        <PPDBForm units={units} initialUnit={initialUnit} ppdbConfigs={ppdbConfigs} />
      </div>

      {/* FAQ Section */}
      <FAQSection data={faqs as FaqItem[]} />
      
      <Footer />
    </main>
  );
}
