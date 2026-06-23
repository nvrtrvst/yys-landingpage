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


# Walkthrough — Audit & Optimasi Selesai ✅

Build status: `✓ Compiled successfully | ✓ Linting and checking validity of types`

---

## 🔴 Bug Fix — SQL Crash

### 1. `ppdb/page.tsx` — Kolom `is_active` tidak ada
Query `WHERE is_active = 1` digunakan padahal kolom tersebut tidak ada di tabel `faqs`. Halaman PPDB akan crash jika ada data FAQ di database. **Diperbaiki** → `ORDER BY order_index ASC, id ASC`.

### 2. `scp/(dashboard)/page.tsx` — Kolom `start_date`/`end_date` tidak ada
Dashboard admin menampilkan "Event Aktif" dengan query `WHERE start_date >= NOW() OR end_date >= NOW()`, padahal schema hanya punya `event_date`. Dashboard crash setiap kali dibuka. **Diperbaiki** → `WHERE event_date >= CURDATE()`.

---

## 🌐 Cross-browser / Cross-OS Compatibility

### 3. `ImageParallax.tsx` — Reduced Motion guard
Komponen parallax tidak mendeteksi preferensi "Reduce Motion" OS. Di macOS dengan Reduce Motion aktif, animasi parallax tetap berjalan dan memicu hydration mismatch. **Diperbaiki** → komponen sekarang merender gambar statis `<img>` saat `useReducedMotion()` bernilai `true`, menghilangkan animasi dan error hydration sepenuhnya.

---

## 🔒 Keamanan (Security)

### 4. `layout.tsx` — Logout via GET diganti POST
Logout lama menggunakan link biasa `<a href="/api/auth/signout">` yang memanggil endpoint via GET — cara yang kurang aman karena bisa dipicu oleh prefetch atau link injeksi. **Diperbaiki** dengan membuat [`SignOutButton.tsx`](file:///Volumes/MacData/Data/yayasan-apps/yys-landingpage/src/app/scp/(dashboard)/SignOutButton.tsx) sebagai client component yang memanggil `signOut({ callbackUrl: "/scp/login" })` dari `next-auth/react`.

### 5. `PPDBForm.tsx` — Ganti `alert()` native dengan error inline
Native `alert()` bisa diblokir browser, merusak UX, dan tidak bisa ditest otomatis. **Diperbaiki** → error sekarang ditampilkan sebagai pesan merah inline di dalam form step 5 menggunakan React state `errorMsg`.

### 6. `next.config.ts` — Tambahkan X-Robots-Tag
Tambahkan header `X-Robots-Tag: noindex, nofollow` untuk semua path `/scp/*` dan `/api/*` agar halaman admin dan API endpoint tidak terindeks search engine.

---

## ⚡ Optimasi Performa

### 7. `page.tsx` — Lazy loading semua gambar
Semua tag `<img>` di halaman utama (hero background, profil, unit cards, program cards, news cards, galeri) kini menggunakan `loading="lazy"` dan `decoding="async"`. Ini mengurangi First Load JS dan memperbaiki Core Web Vitals (CLS).

### 8. `HeaderUI.tsx` — Logo konsisten & fallback robust
- Ukuran logo disamakan: `h-12 w-auto` untuk keduanya (was: `h-20` vs `w-8 h-8` — inkonsisten besar)
- Filter fallback diperbaiki dari hardcode UUID string `.includes('e2ef58d9')` → `.startsWith('/uploads/dummy/')` yang lebih robust dan mudah dipahami

### 9. `mailer.ts` — Cache SMTP transporter
SMTP transporter sebelumnya dibuat baru di setiap request email. Sekarang di-cache di module level dengan `getTransporter()` — cukup satu instance selama server hidup, mengurangi overhead koneksi.

---

## 🗄️ Schema & Seeder

### 10. [`full_schema.sql`](file:///Volumes/MacData/Data/yayasan-apps/yys-landingpage/full_schema.sql) — Schema lengkap & tunggal
Menggabungkan `schema.sql` + `migration_update.sql` + tabel `unit_majors` yang sebelumnya tidak ada di file apapun tapi digunakan di production. Sekarang satu file otoritatif untuk setup database baru.

### 11. [`full_seed.sql`](file:///Volumes/MacData/Data/yayasan-apps/yys-landingpage/full_seed.sql) — Seed dengan data aktual
Berisi **semua data dari database** saat ini:
- 36 `settings` (site_logo direset ke `/uploads/dummy/site_logo.png`)
- 5 `units` (LPQ, TK, SD, SMP, SMK)
- 3 `unit_majors` (SMK: TKJ, MM, AKT)
- 3 `programs`
- 2 `testimonials`
- 3 `faqs`
- 2 `news` (published)
- 6 `galleries` (menggunakan gambar dummy — backup `public/uploads/` secara manual)
- 1 admin user default

---

## 📋 Cara Pindah Laptop

```bash
# 1. Clone/copy project
# 2. Buat database dan jalankan schema + seed
mysql -u root < full_schema.sql
mysql -u root yayasan_db < full_seed.sql

# 3. Salin gambar upload (manual)
# Backup dari: public/uploads/  (semua file non-dummy)
# Restore ke: public/uploads/   di laptop baru

# 4. Buat .env baru (copy dari .env.example atau buat manual)
# 5. Install dependencies
npm install

# 6. Jalankan
npm run dev
```

> **Login admin default:** `admin@nuurulmuttaqiin.or.id` / `Admin@1234`  
> **Segera ganti password setelah login pertama!**

---

## ✅ Verifikasi Build
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (11/11)
✓ Finalizing page optimization
```
