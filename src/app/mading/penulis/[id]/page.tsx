import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { PostCard } from "@/components/mading/PostCard";
import Link from "next/link";
import { MadingHeader } from "@/components/mading/MadingHeader";
import { MadingFooter } from "@/components/mading/MadingFooter";
import { ThemeProvider } from "@/components/mading/ThemeProvider";
import { UserAvatar } from "@/components/mading/UserAvatar";

interface MadingPostRow {
  id: number;
  slug?: string;
  title: string;
  excerpt?: string;
  cover_image?: string | null;
  author_name?: string;
  category_name?: string;
  category_slug?: string;
  published_at?: string;
  created_at: string;
  status?: string;
  views?: number;
}

const PER_PAGE = 12;

export const revalidate = 60;

export default async function PenulisPage({
  params, searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const id = (await params).id;
  const page = Math.max(1, parseInt((await searchParams).page || "1"));

  const [authorRows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, name, email, role, unit_id, photo FROM users WHERE id = ? AND role = 'siswa'", [id]
  );
  if (authorRows.length === 0) {
    return (
      <ThemeProvider>
        <MadingHeader />
        <div className="flex-1 flex items-center justify-center text-gray-500 py-20">Penulis tidak ditemukan</div>
        <MadingFooter />
      </ThemeProvider>
    );
  }
  const author = authorRows[0];

  const [[unitRows], [countRows], [posts]] = await Promise.all([
    pool.execute<RowDataPacket[]>(
      "SELECT id, name, slug FROM units WHERE id = ?", [author.unit_id]
    ),
    pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM mading_posts WHERE author_id = ? AND status = 'approved'", [id]
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT p.id, p.slug, p.title, LEFT(p.content, 200) as excerpt, p.cover_image, p.published_at, p.created_at, p.views,
              u.name as author_name, c.name as category_name
       FROM mading_posts p LEFT JOIN users u ON p.author_id = u.id LEFT JOIN mading_categories c ON p.category_id = c.id
       WHERE p.author_id = ? AND p.status = 'approved' ORDER BY p.published_at DESC LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`,
      [id]
    ),
  ]);
  const unit = unitRows[0] as RowDataPacket | undefined;
  const total = (countRows[0] as RowDataPacket).total;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <ThemeProvider>
      <MadingHeader />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
      <Link href="/mading" className="text-sm text-gray-400 hover:text-green-600">&larr; Semua Unit</Link>
      <div className="mt-4 mb-8">
        <UserAvatar name={author.name} photo={author.photo} size={64} className="rounded-full mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">{author.name}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {unit ? `Siswa ${unit.name}` : "Siswa"} &middot; {total} tulisan
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Belum ada tulisan yang tayang</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {(posts as MadingPostRow[]).map((post) => (
              <PostCard key={post.id} post={post} unitSlug={unit?.slug} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              {page > 1 && (
                <Link href={`/mading/penulis/${id}?page=${page - 1}`}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">&larr; Sebelumnya</Link>
              )}
              <span className="text-sm text-gray-500">Halaman {page} dari {totalPages}</span>
              {page < totalPages && (
                <Link href={`/mading/penulis/${id}?page=${page + 1}`}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Selanjutnya &rarr;</Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
      <MadingFooter />
    </ThemeProvider>
  );
}
