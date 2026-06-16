import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { notFound } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

export const revalidate = 60;

export default async function BeritaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  let newsItem: RowDataPacket | null = null;
  
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM news WHERE slug = ? AND status = 'published'",
      [(await params).slug]
    );
    
    if (rows.length === 0) {
      notFound();
    }
    
    newsItem = rows[0];
  } catch (error) {
    console.error("Failed to fetch news detail", error);
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
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
