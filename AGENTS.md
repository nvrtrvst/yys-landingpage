<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — CMS Yayasan Nuurul Muttaqiin

## Ringkasan
CMS + landing page untuk Yayasan Pendidikan Islam Nuurul Muttaqiin. Dua sisi:
- **Site publik** (Next.js App Router): beranda, berita, agenda, PPDB (pendaftaran), unit sekolah.
- **Admin SCP** (`/scp`): dashboard untuk superadmin/admin/editor kelola konten, user, galeri, event, testimoni, PPDB, backup DB.

Bahasa UI: Indonesia. Role: `superadmin`, `admin`, `editor`.

## Tech Stack
- **Next.js 16.2.9** (App Router), **React 19.2.4**, **TypeScript 5**.
- **Tailwind CSS v4** — konfig CSS-first via `@theme` di `src/app/globals.css`. TIDAK ada `tailwind.config.ts`.
- **MySQL** via `mysql2/promise` (connection pool, global cached). Lihat `src/lib/db.ts`.
- **NextAuth v4.24** — Credentials provider, JWT session (`maxAge: 8h`), `src/lib/auth.ts`.
- **bcrypt 6** — hash password (salt rounds 10).
- **sharp 0.35** — proses/upload gambar (re-encode ke webp).
- **sonner** — toast. **lucide-react** — ikon. **framer-motion** — animasi.
- **isomorphic-dompurify** — sanitasi rich text (XSS). **TipTap 3** — rich text editor admin.
- **zod 4** — validasi input API. **react-big-calendar** — event. **jspdf** + **html2canvas** — PDF/print kartu.
- **nodemailer** + Brevo SMTP — email. **mysqldump** — backup DB.
- Environment: **Windows + PowerShell** (path dengan `(route group)` butuh quoting di git/bash).

## Struktur Direktori
- `src/app/` — halaman & route handlers.
  - Publik: `page.tsx`, `berita/`, `agenda/`, `ppdb/`, `unit/[slug]/`.
  - Admin: `scp/login/page.tsx`, `scp/(dashboard)/*` (layout + halaman), `scp/print-kelulusan`.
  - API: `src/app/api/auth/[...nextauth]`, `api/ppdb*`, `api/admin/*`.
- `src/components/` — `Header`/`HeaderUI`, `Footer`, `WhatsAppWidget`, `parallax/*`, `admin/RichTextEditor`, dsb.
- `src/lib/` — `db.ts`, `auth.ts`, `mailer.ts`, `rate-limit.ts`, `upload.ts`.
- Root SQL: `schema.sql`, `seed.sql`, `full_schema.sql`, `full_seed.sql`, `migration_*.sql` (jalankan manual di prod).

## Konvensi Penting
- **Tailwind v4**: jangan buat `tailwind.config.ts`. Custom color (`primary-*`, `accent-*`) & font di `@theme` (globals.css). Aturan CSS global WAJIB dibungkus `@layer base` agar tidak mengalahkan utility (`img { ... }` pernah hancurkan layout karena tidak di-layer).
- **Server vs Client**: `layout.tsx` (route group) adalah async Server Component. JANGAN kirim komponen React (ikon lucide) sebagai prop ke Client Component — pecah serialisasi RSC. `SidebarLayout.tsx` mendefinisikan `navItems` sendiri (client).
- **DB**: selalu pakai parameterized query (`pool.execute(sql, [params])`). Jangan interpolation string ke SQL.
- **Rich text**: semua `dangerouslySetInnerHTML` WAJIB lewat `DOMPurify.sanitize(...)`.
- **Upload**: validasi magic-byte (JPEG/PNG/WebP/PDF), gambar di-re-encode sharp → webp. Tolak SVG.
- **Error API**: pesan generik Indonesia ("Tidak terautentikasi", "Dilarang", "Kesalahan server internal"). JANGAN return raw `error.message` ke client (info-leak) — cukup `console.error` di server.
- **Catch block**: `catch (error: unknown)` + `error instanceof Error` sebelum akses `.message`/`.code`.
- **Git**: path `scp/(dashboard)` punya kurung — quote di PowerShell: `git add 'src/app/scp/(dashboard)/...'`.

## Autentikasi & Otorisasi
- Login: `signIn("credentials", ...)` dari `scp/login/page.tsx` (client component).
- Session: JWT, `maxAge 8h`, cookie `httpOnly` + `sameSite: strict` + `secure` (prod).
- Proteksi halaman admin: `getServerSession` + cek `session.user.role` di tiap route handler & layout.
- **Brute-force**: rate-limit (`src/lib/rate-limit.ts`, in-memory Map) + account lockout (5 gagal → `locked_until` +15 menit, kolom di tabel `users`).
- Role gating: superadmin/admin kelola user & backup; editor terbatas.

## Model Keamanan (sudah diterapkan)
- **Rate limit**: login (10/menit/IP + 5/15 menit/email), endpoint admin (`users` 10/m, `users/[id]` 20/m, `settings` 10/m, `upload` 20/m, `profile/password` 5/15m). Key by IP via `x-forwarded-for`.
- **CSP** (`next.config.ts`): `script-src 'self' 'unsafe-inline'` (TANPA `unsafe-eval`). `unsafe-inline` dipertahankan karena Next 16 butuh script bootstrap — menghapusnya break app. Plus `X-Frame-Options: DENY`, `nosniff`, HSTS (prod), `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`.
- **XSS**: DOMPurify di semua rich text; upload strip SVG + re-encode.
- **CSRF**: cookie `sameSite: strict` + token NextAuth.
- **Catatan**: rate-limit in-memory hanya efektif di 1 instance server. Multi-instance/severless butuh Redis.

## API Routes (ringkas)
- `api/auth/[...nextauth]` — NextAuth.
- `api/ppdb` (POST submit), `api/ppdb/majors` (GET, integrasi keuangan).
- `api/admin/*` — butuh session + role: `news`, `users`, `settings`, `gallery`, `events`, `units`, `programs`, `testimonials`, `faqs`, `ppdb` (inkl. `send-card`, `mass-print`), `upload`, `profile/password`, `backup`. Semua rate-limited & pakai pesan error Indonesia.

## Environment Variables (.env)
- `DATABASE_URL` — `mysql://user:pass@host:port/db`.
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (default `http://localhost:5000`), `NEXT_PUBLIC_APP_URL`.
- `KEUANGAN_API_URL`, `KEUANGAN_INTEGRATION_KEY` — integrasi sistem keuangan PPDB.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — Brevo.
- `ENABLE_EXTERNAL_SIM_SYNC`, `NEXT_PUBLIC_EXTERNAL_SIM_API_URL` — sync opsional.
- (Settings `recaptcha_site`/`recaptcha_secret` ada di DB tapi saat ini TIDAK dipakai.)

## Perintah
- `npm run dev` → `next dev -p 5000`
- `npm run build` → `next build`
- `npm run start` → `next start -p 5000`
- `npm run lint` → `eslint`
- Typecheck: `npx tsc --noEmit` (jalankan sebelum commit).

## Catatan Deployment
- Port **5000** (bukan 3000).
- Migrasi DB = jalankan file `migration_*.sql` manual di MySQL prod (tidak auto-migrate).
- Pastikan `NEXTAUTH_SECRET` & `SMTP_PASS` di-set (jangan commit).
- `middleware.ts` ada (proxy/rewrite) — review sebelum ubah routing.

## Gotchas / Pelajaran
- Global CSS di luar `@layer` mengalahkan Tailwind utility (pernah hancurkan layout gambar).
- Kirim fungsi/komponen React dari Server ke Client Component = error serialisasi RSC.
- `rate-limit.ts` in-memory: reset saat restart, tidak share antar instance.
- Saat edit file di `scp/(dashboard)`, quote path di PowerShell/git.
