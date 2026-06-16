# Website Yayasan Nuurul Muttaqiin

Proyek website fullstack dengan Next.js 14 (App Router), Tailwind CSS, MySQL (mysql2), dan NextAuth.

## Persiapan Environment

1. Copy file `.env.example` menjadi `.env`.
2. Sesuaikan kredensial `DATABASE_URL` dengan database MySQL lokal Anda.
3. Buat database `yayasan_db` di MySQL.
4. Import struktur tabel dengan menjalankan: `mysql -u root -p < schema.sql`
5. (Opsional tapi disarankan) Import data dummy awal: `mysql -u root -p yayasan_db < seed.sql`

## Menjalankan Aplikasi

1. Install dependensi: `npm install`
2. Jalankan development server: `npm run dev`
3. Buka `http://localhost:5000`

## Akses Admin (CMS)

- URL: `http://localhost:5000/admin/login`
- Jika menggunakan data seed, login menggunakan:
  - Email: `admin@yayasan.com`
  - Password: `password123`

## Struktur Direktori Utama

- `src/app/` - Halaman Publik (Beranda, PPDB)
- `src/app/admin/` - Halaman CMS (Dashboard, dll)
- `src/app/api/` - Endpoint API (Auth, Submit PPDB, dll)
- `src/components/` - Komponen React reusable (Header, Footer, Providers)
- `src/lib/` - Utility seperti database connection (`db.ts`) dan otentikasi (`auth.ts`)
- `schema.sql` - Skema tabel database
- `seed.sql` - Data awal (dummy data) untuk testing
