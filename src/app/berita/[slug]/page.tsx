import { cache } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import pool, { getSettings } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { newsPath } from "@/lib/news-links";
import { foundationUrl } from "@/lib/unit-sites";

export const revalidate = 60;

const loadNews = cache(async (slug: string) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT n.title, n.content, n.image_url, n.published_at, n.created_at, n.unit_id, u.slug AS unit_slug
       FROM news n LEFT JOIN units u ON u.id = n.unit_id
       WHERE n.slug = ? AND n.status = 'published'`,
      [slug]
    );
    return { news: rows[0] ?? null, failed: false };
  } catch (error) {
    console.error("Failed to fetch news detail", error);
    return { news: null, failed: true };
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { news, failed } = await loadNews(slug);
  if (failed || !news) return {};
  if (news.unit_id) return { robots: { index: false, follow: true } };

  const settings = await getSettings();
  const description = String(news.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
    || `${news.title} — Yayasan Nuurul Muttaqiin.`;
  const image = news.image_url && !String(news.image_url).startsWith("/uploads/dummy/")
    ? String(news.image_url)
    : settings.og_image || settings.site_logo || undefined;
  const url = `${foundationUrl()}/berita/${slug}`;
  const published = news.published_at ? new Date(String(news.published_at)).toISOString() : undefined;
  const modified = news.created_at ? new Date(String(news.created_at)).toISOString() : published;

  return {
    title: { absolute: String(news.title) },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: String(news.title),
      description,
      url,
      images: image ? [{ url: image, alt: String(news.title) }] : undefined,
      publishedTime: published,
      modifiedTime: modified,
    },
    twitter: { card: "summary_large_image", title: String(news.title), description, images: image ? [image] : undefined },
  };
}

export default async function BeritaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { news: newsItem, failed } = await loadNews(slug);

  if (failed) {
    return (
      <main className="min-h-screen flex flex-col bg-white">
        <div className="bg-primary-900"><Header /></div>
        <div className="flex-1 flex items-center justify-center px-4 py-24 text-center">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900 mb-3">Berita belum dapat dimuat</h1>
            <p className="text-gray-600 mb-6">Silakan coba lagi beberapa saat lagi.</p>
            <Link href="/berita" className="inline-block px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition">
              Kembali ke Daftar Berita
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!newsItem) notFound();
  if (newsItem.unit_id) {
    if (newsItem.unit_slug) permanentRedirect(newsPath(String(newsItem.unit_slug), slug));
    notFound();
  }

  const base = foundationUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: String(newsItem.title),
    image: newsItem.image_url ? [`${base}${String(newsItem.image_url)}`] : undefined,
    datePublished: newsItem.published_at ? new Date(String(newsItem.published_at)).toISOString() : undefined,
    dateModified: newsItem.created_at ? new Date(String(newsItem.created_at)).toISOString() : undefined,
    author: { "@type": "Organization", name: "Yayasan Nuurul Muttaqiin" },
    publisher: {
      "@type": "Organization",
      name: "Yayasan Nuurul Muttaqiin",
      logo: { "@type": "ImageObject", url: `${base}/logo.png` },
    },
    mainEntityOfPage: `${base}/berita/${slug}`,
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-primary-900">
        <Header />
        {/* Compact header for detail pages */}
        <div className="pt-24 pb-8"></div>
      </div>

      <div className="flex-1 py-12 px-4 md:px-0">
        <article className="max-w-3xl mx-auto">
          <Link href="/berita" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8 font-medium">
            &larr; Kembali ke Daftar Berita
          </Link>
          
          <header className="mb-10">
            <div className="text-primary-600 font-medium mb-4">
              {new Date(newsItem.published_at || newsItem.created_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-8">
              {newsItem.title}
            </h1>
            
            <div className="aspect-[2/1] bg-gray-100 rounded-2xl relative overflow-hidden mb-10">
              {newsItem.image_url ? (
                <img src={newsItem.image_url} alt={newsItem.title} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Tidak ada gambar cover
                </div>
              )}
            </div>
          </header>

          <div 
            className="prose prose-lg prose-green max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(newsItem.content) }}
          />
        </article>
      </div>

      <Footer />
    </main>
  );
}
