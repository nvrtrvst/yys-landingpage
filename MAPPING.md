# Pemetaan Modul CMS Admin ke Landing Page

Dokumen ini memetakan relasi antara tabel database (yang dikelola melalui Panel Admin) dengan komponen dan halaman publik di Landing Page. Tujuannya adalah untuk memudahkan developer melacak alur data saat melakukan penambahan atau modifikasi fitur.

## 1. Pengaturan Situs (Settings)
- **Tabel Database**: `settings` (kolom: `setting_key`, `setting_value`)
- **Dikelola di Admin**: `/admin/settings`
- **Ditampilkan di Frontend**:
  - `src/components/Header.tsx` (Logo, Nama Yayasan)
  - `src/components/Footer.tsx` (Alamat, No HP, Email, Sosial Media, Deskripsi Singkat)
  - `src/app/page.tsx` - Hero Section (`hero_title`, `hero_subtitle`, `hero_background`, `site_tagline`)
  - `src/app/page.tsx` - Section Tentang Kami (`profile_history`, `stat_students`, `stat_founded`)
- **Metode Fetching**: Server-side menggunakan utilitas `getSettings()` dari `src/lib/db.ts`.

## 2. Unit Sekolah & Program Unggulan
- **Tabel Database**: `units`, `programs`
- **Dikelola di Admin**: `/admin/units` (termasuk kelola Program di dalamnya)
- **Ditampilkan di Frontend**:
  - `src/components/Header.tsx` - Dropdown navigasi "Unit Sekolah"
  - `src/components/Footer.tsx` - Tautan cepat unit sekolah
  - `src/app/page.tsx` - Section "Unit Sekolah" (Card List)
  - `src/app/unit/[slug]/page.tsx` - Halaman Detail spesifik tiap unit sekolah beserta daftar program unggulannya.
- **Kondisi Query**: Menampilkan yang berstatus aktif (jika ada flag) dan diurutkan berdasarkan `order_index` ASC.

## 3. Berita & Artikel
- **Tabel Database**: `news`
- **Dikelola di Admin**: `/admin/news`
- **Ditampilkan di Frontend**:
  - `src/app/page.tsx` - Section "Berita & Kegiatan Terbaru" (Menampilkan 3 terbaru)
  - `src/app/berita/page.tsx` - Halaman daftar berita keseluruhan (Grid)
  - `src/app/berita/[slug]/page.tsx` - Halaman detail bacaan berita
- **Kondisi Query**: `WHERE status = 'published' ORDER BY published_at DESC`

## 4. Galeri Kegiatan
- **Tabel Database**: `galleries`
- **Dikelola di Admin**: `/admin/gallery`
- **Ditampilkan di Frontend**:
  - `src/app/page.tsx` - Section "Galeri Kegiatan" (Grid Masonry)
- **Kondisi Query**: Menampilkan seluruh foto yang ada di tabel, biasanya diurutkan berdasarkan terbaru (`created_at DESC`).

## 5. Testimoni & FAQ
- **Tabel Database**: `testimonials`, `faqs`
- **Dikelola di Admin**: `/admin/testimonials` dan `/admin/settings` (FAQ biasanya digabung atau di menu khusus)
- **Ditampilkan di Frontend**:
  - `src/app/page.tsx` - Section "Testimoni" (Slider / Grid Card)
  - `src/app/ppdb/page.tsx` - Section "Tanya Jawab (FAQ)" khusus info PPDB
- **Kondisi Query**: Berdasarkan `is_active = 1` dan diurutkan menggunakan `order_index`.

## 6. Agenda / Kalender Akademik
- **Tabel Database**: `events`
- **Dikelola di Admin**: `/admin/events`
- **Ditampilkan di Frontend**:
  - `src/app/agenda/page.tsx` - Halaman khusus menampilkan daftar event yang akan datang.
- **Kondisi Query**: `WHERE start_date >= NOW() ORDER BY start_date ASC`

## 7. Data PPDB (Penerimaan Peserta Didik Baru)
- **Tabel Database**: `ppdb_submissions`
- **Dikelola di Admin**: `/admin/ppdb` (sebagai Read-Only / Update Status)
- **Ditampilkan di Frontend**:
  - `src/app/ppdb/page.tsx` - Form Pendaftaran Publik (Aksi: INSERT ke tabel)
  - `src/app/ppdb/status/page.tsx` - Halaman untuk Cek Status Kelulusan
- **Alur Data**: Pendaftar mengisi di `/ppdb` -> Masuk ke DB -> Admin verifikasi status -> Pendaftar mengecek lewat `/ppdb/status` dengan `registration_number`.

## 8. Ringkasan Mapping (Tabel)

| Menu Admin | Tabel Database | Field Penting | Tampil di Halaman/Section Publik | Catatan |
|---|---|---|---|---|
| Testimonials & FAQ | testimonials | nama, peran, isi, foto, status, urutan | Homepage - Section "Testimoni" (sebelum footer) | |
| Testimonials & FAQ | faqs | kategori, pertanyaan, jawaban, status, urutan | /ppdb - Section FAQ (bagian bawah halaman) | |
