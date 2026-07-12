import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";
import Image from "next/image";

const PAGE_SIZE = 9;

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let newsList: RowDataPacket[] = [];
  let total = 0;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`
    );
    newsList = rows;
    const [count] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM news WHERE status = 'published'"
    );
    total = Number((count[0] as { total: number }).total);
  } catch (error) {
    console.error("Failed to fetch news", error);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const prevHref = page > 1 ? `/berita?page=${page - 1}` : "#";
  const nextHref = page < totalPages ? `/berita?page=${page + 1}` : "#";

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-primary-900 pb-20">
        <Header />
        <div className="pt-32 pb-10 text-center text-white px-4">
          <h1 className="font-serif text-4xl font-bold mb-4">Berita & Kegiatan</h1>
          <p className="text-primary-100 max-w-2xl mx-auto">
            Ikuti perkembangan terbaru dan informasi kegiatan di lingkungan Yayasan Nuurul Muttaqiin.
          </p>
        </div>
      </div>

      <div className="flex-1 -mt-16 mb-20 px-4 md:px-0">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsList.length > 0 ? (
              newsList.map((news) => (
                <Link key={news.id} href={`/berita/${news.slug}`} className="group block h-full">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex flex-col h-full border border-gray-100">
                    <div className="aspect-[16/10] bg-gray-200 relative overflow-hidden">
                      {news.image_url ? (
                        <img src={news.image_url} alt={news.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          Tidak ada gambar
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/10 transition-colors duration-300"></div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="text-sm text-primary-600 font-medium mb-3">
                        {new Date(news.published_at || news.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {news.title}
                      </h2>
                      {/* Removing HTML tags for excerpt */}
                      <p className="text-gray-600 line-clamp-3 mb-4 flex-1 text-sm">
                        {news.content.replace(/<[^>]*>?/gm, '')}
                      </p>
                      <span className="text-primary-600 font-semibold text-sm group-hover:text-primary-700 flex items-center gap-1">
                        Baca Selengkapnya <span className="text-lg leading-none">&rarr;</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-xl shadow p-12 text-center text-gray-500">
                Belum ada berita yang diterbitkan.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <Link
                href={prevHref}
                aria-disabled={page <= 1}
                className={`px-5 py-2 rounded-full border text-sm font-semibold transition ${page <= 1 ? "pointer-events-none opacity-40 border-gray-200 text-gray-400" : "border-primary-200 text-primary-700 hover:bg-primary-50"}`}
              >
                &larr; Sebelumnya
              </Link>
              <span className="text-sm text-gray-500">
                Halaman {page} dari {totalPages}
              </span>
              <Link
                href={nextHref}
                aria-disabled={page >= totalPages}
                className={`px-5 py-2 rounded-full border text-sm font-semibold transition ${page >= totalPages ? "pointer-events-none opacity-40 border-gray-200 text-gray-400" : "border-primary-200 text-primary-700 hover:bg-primary-50"}`}
              >
                Berikutnya &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
