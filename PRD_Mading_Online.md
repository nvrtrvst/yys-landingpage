# Product Requirements Document (PRD)
## Aplikasi Mading Online Multi-Unit — Yayasan Nuurul Muttaqiin

| | |
|---|---|
| **Versi Dokumen** | 2.0 |
| **Tanggal** | 11 Juli 2026 |
| **Status** | Draft — untuk implementasi |
| **Tech Stack** | Backend: Laravel · Frontend: React.js |
| **Integrasi dengan** | Aplikasi existing (Landing Page + `/scp` Superadmin CMS + PPDB) — dikembangkan sebagai modul tambahan dalam monolith yang sama |
| **Domain utama** | `nuurulmuttaqiin.or.id` (dikuasai penuh oleh Yayasan) |
| **Domain modul mading** | `mading.nuurulmuttaqiin.or.id` (hub) + subdomain per unit (lihat Bagian 8) |
| **Cakupan unit** | LPQ, TK, SD, SMP, SMK — 5 unit di bawah satu yayasan |
| **Pemilik produk** | Petugas Yayasan (bukan petugas sekolah/unit individual) |

---

## 1. Ringkasan Eksekutif

Mading Online adalah modul baru dalam aplikasi existing yang memungkinkan siswa dari **5 unit pendidikan (LPQ, TK, SD, SMP, SMK) di bawah satu yayasan** membuat tulisan/konten, guru melakukan kurasi dan moderasi, Admin Unit mengelola operasional mading di unitnya masing-masing, serta Superadmin Yayasan mengawasi keseluruhan sistem lintas unit. Modul ini dibangun menyatu (monolith, satu database) dengan sistem landing page, `/scp`, dan PPDB yang sudah ada.

**Karakteristik utama yang membedakan produk ini dari mading sekolah tunggal:** aplikasi bersifat **multi-unit (multi-tenant ringan)** — satu basis kode dan satu database melayani 5 unit sekaligus, dengan branding (logo, nama, warna) yang **dinamis mengikuti unit user yang login atau subdomain yang diakses**, tanpa perlu deploy aplikasi terpisah per unit. Ini penting karena pemilik produk adalah petugas Yayasan yang mengawasi seluruh unit, bukan petugas satu sekolah, dan tidak memiliki kewenangan atas domain `.sch.id` milik masing-masing unit yang mungkin berdiri sendiri.

Prioritas non-fungsional utama: **keamanan berlapis** (termasuk isolasi data antar unit/tenant, pencegahan SQL injection, XSS, brute force, CSRF, dan bypass akses berbasis URL) serta **performa tinggi** (caching, lazy loading, optimasi query, dan optimasi aset media) dan **UI/UX modern** yang responsif di seluruh perangkat.

---

## 2. Latar Belakang & Konteks

- Sistem existing: Landing page publik `nuurulmuttaqiin.or.id`, `/scp` sebagai CMS kecil untuk superadmin, dan form PPDB yang saat ini berjalan lewat dua pintu (form web + Google Docs eksternal).
- Pemilik produk adalah **petugas Yayasan Nuurul Muttaqiin**, yang membawahi **5 unit pendidikan**: LPQ, TK, SD, SMP, dan SMK — bukan petugas salah satu sekolah secara individual.
- Beberapa unit (contoh: SMK) berpotensi memiliki domain resminya sendiri (`smknuurulmuttaqiin.sch.id`) yang **berada di luar kewenangan Yayasan**, sehingga modul mading ini **wajib dibangun di atas domain yang dikuasai Yayasan** (`nuurulmuttaqiin.or.id`), bukan bergantung pada domain masing-masing unit.
- Tiap unit membutuhkan wadah digital bagi siswanya untuk berekspresi lewat tulisan (mading = majalah dinding), dengan pengawasan editorial dari guru, mirip model "citizen journalism dengan editor" — namun **identitas visual (logo, nama, warna) harus otomatis menyesuaikan unit** yang sedang diakses/login, tanpa Yayasan perlu membangun 5 aplikasi terpisah.
- Proyek masih dalam tahap development, belum ada beban production — memberi keleluasaan merancang arsitektur data, multi-tenancy, dan keamanan dari awal tanpa migrasi data legacy.

---

## 3. Tujuan Produk (Goals)

1. Menyediakan platform bagi siswa untuk submit tulisan/pertanyaan secara digital, menggantikan mading fisik.
2. Memberikan guru kontrol editorial (approve/reject/revisi) sebelum konten tayang ke publik.
3. Memberikan superadmin kontrol penuh atas user, konten, kategori, dan kebijakan moderasi.
4. Menjamin keamanan data dan akses sesuai standar aplikasi web modern.
5. Menjamin performa cepat meski trafik dan volume konten bertambah seiring waktu.

### Non-Goals (di luar cakupan versi ini)
- Tidak menangani proses PPDB (sudah ada modul terpisah).
- Tidak membangun fitur chat real-time antar user.
- Tidak membangun native mobile app (cukup responsive web).

---

## 4. User Roles & Persona

| Role | Deskripsi | Level Akses | Cakupan |
|---|---|---|---|
| **Superadmin Yayasan** | Pengelola tertinggi seluruh sistem (petugas Yayasan, bisa orang yang sama dengan admin `/scp`) | Penuh atas seluruh modul, semua unit | Lintas 5 unit |
| **Admin Unit** *(baru)* | Perwakilan/kepala unit (misal kepala sekolah, guru senior yang ditunjuk) yang mengelola operasional mading di unitnya sendiri | Kelola user (guru/siswa), kategori khusus unit, dan moderasi di unitnya sendiri | 1 unit saja |
| **Guru** | Staf pengajar yang menjadi editor/kurator konten mading | Moderasi & publish tulisan siswa di unitnya | 1 unit saja |
| **Siswa** | Pengguna yang membuat tulisan/pertanyaan | Terbatas pada konten miliknya sendiri | 1 unit saja |
| **Pengunjung (Publik)** | Pembaca mading tanpa login | Read-only pada konten yang sudah approved | Sesuai unit yang diakses (subdomain), atau semua unit lewat halaman hub |

> **Catatan desain:** Role menggunakan *Role-Based Access Control* (RBAC) via package `spatie/laravel-permission`, **dikombinasikan dengan konsep "Teams" bawaan package tersebut** (`spatie/laravel-permission` mendukung mode teams) di mana `unit_id` berperan sebagai team ID. Artinya satu user bisa saja punya role berbeda di context berbeda (jarang terjadi, tapi arsitekturnya sudah siap), dan yang lebih penting: **setiap pengecekan permission otomatis ter-scope ke unit yang bersangkutan**, bukan hanya berdasarkan role saja. Ini kunci utama mencegah Admin Unit atau Guru di satu unit mengakses/mengubah data unit lain.

---

## 5. Alur Fungsional Utama (User Flow)

### 5.1 Alur Siswa
1. Login → Dashboard siswa
2. Buat tulisan baru (judul, isi, kategori, gambar opsional) → simpan sebagai **draft**
3. Submit draft → status berubah jadi **pending review**
4. Menerima notifikasi status: **approved**, **rejected**, atau **revisi diminta**
5. Jika approved → tulisan tayang di mading publik dengan nama penulis

### 5.2 Alur Guru
1. Login → Dashboard moderasi (queue tulisan pending, per kategori/kelas jika diperlukan)
2. Baca isi tulisan → pilih aksi: **Approve**, **Reject** (dengan alasan wajib diisi), atau **Minta Revisi** (dengan catatan)
3. Guru juga bisa membuat tulisan sendiri (auto-approved atau tetap lewat review superadmin, tergantung kebijakan)
4. Guru bisa mengelola kategori/rubrik dalam batas yang diizinkan superadmin

### 5.3 Alur Admin Unit *(baru)*
1. Login → Dashboard khusus unitnya (misal Admin Unit SMK hanya melihat data SMK)
2. Kelola user di unitnya: tambah/nonaktifkan akun guru & siswa unit tersebut, assign siapa yang jadi guru moderator
3. Kelola kategori tambahan khusus unitnya (di luar kategori global yang ditetapkan Yayasan)
4. Melihat statistik dan moderasi tulisan di unitnya (setara guru, plus kelola user)
5. **Tidak bisa** melihat atau mengubah data unit lain, dan **tidak bisa** mengubah pengaturan global/kategori global (itu wewenang Superadmin Yayasan)

### 5.4 Alur Superadmin Yayasan
1. Login → Dashboard analitik **lintas 5 unit** (jumlah tulisan, user aktif, tulisan pending per unit, perbandingan antar unit)
2. Kelola data unit: tambah/edit unit baru, atur logo/nama/warna tema tiap unit, atur subdomain
3. Kelola user & role di semua unit, termasuk menunjuk/mencabut Admin Unit
4. Kelola kategori global (berlaku untuk semua unit) — kategori khusus unit tetap didelegasikan ke Admin Unit
5. Override penuh: bisa approve/reject/hapus tulisan apa pun di unit mana pun
6. Melihat audit log aktivitas sensitif lintas seluruh unit (login, perubahan role, penghapusan konten)

### 5.5 Diagram Status Konten
```
[Draft] → [Submitted/Pending] → [Approved] → (Published, publik)
                              ↘ [Revision Requested] → kembali ke Draft (siswa edit ulang)
                              ↘ [Rejected] → (arsip, tidak tayang, alasan tercatat)
```

---

## 6. Functional Requirements

### 6.1 Autentikasi & Manajemen User
- FR-1.1: Login menggunakan sistem auth yang sama dengan aplikasi existing (Laravel Sanctum/session-based).
- FR-1.2: Role ditentukan lewat RBAC (superadmin, guru, siswa).
- FR-1.3: Superadmin dapat membuat akun guru & siswa secara bulk (import CSV) atau manual.
- FR-1.4: Password reset via email dengan token expiring.
- FR-1.5: Wajib ada mekanisme *account lockout* setelah percobaan login gagal berulang (lihat bagian keamanan).

### 6.2 Manajemen Konten (Tulisan)
- FR-2.1: Siswa dapat membuat, mengedit (selama masih draft/revisi), dan menghapus draft miliknya sendiri.
- FR-2.2: Siswa dapat mengunggah gambar pendukung tulisan (dengan validasi tipe & ukuran file).
- FR-2.3: Sistem mendukung kategori/rubrik (misal: Opini, Sastra, Prestasi, Tanya-Jawab).
- FR-2.4: Rich text editor sederhana (bold, italic, list, gambar inline) — hindari WYSIWYG yang mengizinkan raw HTML/script demi keamanan (lihat 7.2).
- FR-2.5: Setiap tulisan punya riwayat status (audit trail: siapa mengubah status, kapan, alasan).

### 6.3 Moderasi & Approval
- FR-3.1: Guru memiliki dashboard antrian moderasi dengan filter (kategori, penulis, tanggal submit).
- FR-3.2: Aksi approve/reject/revisi wajib mencatat aktor dan timestamp.
- FR-3.3: Reject dan revisi wajib disertai alasan/catatan yang bisa dibaca siswa.
- FR-3.4: Notifikasi ke siswa saat status tulisannya berubah (in-app notification, opsional email).

### 6.4 Publikasi & Tampilan Publik
- FR-4.1: Halaman mading publik menampilkan tulisan yang sudah approved, dengan pagination/infinite scroll.
- FR-4.2: Pencarian dan filter berdasarkan kategori/kata kunci.
- FR-4.3: Halaman detail tulisan menampilkan nama penulis, kategori, tanggal, dan konten lengkap.
- FR-4.4: (Opsional) Fitur reaksi/like sederhana — tanpa komentar publik untuk meminimalkan risiko moderasi tambahan, kecuali sekolah eksplisit menginginkan kolom komentar.

### 6.5 Administrasi (Superadmin Yayasan)
- FR-5.1: CRUD user, kategori global, dan pengaturan global modul mading.
- FR-5.2: Dashboard statistik lintas unit (jumlah tulisan per status/unit/kategori, user paling aktif per unit, perbandingan antar unit).
- FR-5.3: Audit log untuk semua aksi sensitif (login gagal, perubahan role, hapus konten, perubahan permission) — filterable per unit.
- FR-5.4: Kemampuan menonaktifkan sementara modul mading (maintenance mode) — bisa granular per unit atau seluruh sistem.

### 6.6 Manajemen Unit (Multi-Tenancy) *(baru)*
- FR-6.1: Superadmin Yayasan dapat CRUD data unit: nama, slug/subdomain, logo, warna tema, alamat, status aktif/nonaktif.
- FR-6.2: Superadmin Yayasan dapat menunjuk/mencabut Admin Unit untuk tiap unit.
- FR-6.3: Admin Unit dapat mengelola user (guru & siswa) hanya di unitnya sendiri, termasuk assign guru mana yang jadi moderator.
- FR-6.4: Sistem wajib menampilkan branding (logo, nama, warna) yang sesuai secara otomatis berdasarkan subdomain yang diakses atau `unit_id` user yang login — tanpa perlu deploy ulang.
- FR-6.5: Halaman hub (`mading.nuurulmuttaqiin.or.id`) menampilkan direktori seluruh unit aktif sebagai pintu masuk ke masing-masing subdomain unit.
- FR-6.6: Kategori mendukung mode hybrid: kategori global (dibuat Superadmin Yayasan, tampil di semua unit) dan kategori khusus unit (dibuat Admin Unit, hanya tampil di unit tersebut).

---

## 7. Non-Functional Requirements

### 7.1 Keamanan (Security) — **Prioritas Tinggi**

Seluruh requirement berikut wajib menjadi checklist implementasi, bukan opsional:

**a. SQL Injection**
- Wajib gunakan Eloquent ORM / Query Builder Laravel dengan parameter binding — dilarang keras membangun query dengan string concatenation dari input user.
- Validasi & sanitasi semua input lewat Laravel Form Request classes sebelum masuk ke layer database.

**b. Cross-Site Scripting (XSS)**
- Semua output konten user (tulisan, komentar, nama) wajib di-escape secara default (React sudah escape otomatis, tapi wajib audit setiap penggunaan `dangerouslySetInnerHTML`).
- Jika rich text editor menghasilkan HTML, wajib disaring lewat HTML sanitizer (whitelist tag) baik di backend (misal `HTMLPurifier`) maupun sebelum render di frontend.
- Set header `Content-Security-Policy` (CSP) yang membatasi sumber script/style yang diizinkan.

**c. Cross-Site Request Forgery (CSRF)**
- Gunakan CSRF token bawaan Laravel untuk semua form/state-changing request.
- Untuk API berbasis token (SPA React), gunakan Laravel Sanctum dengan SameSite cookie yang tepat.

**d. Brute Force / Credential Stuffing**
- Rate limiting pada endpoint login (misal maksimal 5 percobaan per menit per IP, lalu throttle/lockout sementara) menggunakan Laravel Throttle Middleware.
- Captcha (misal hCaptcha/Google reCAPTCHA v3) pada form login dan registrasi setelah beberapa kali gagal.
- Notifikasi ke user (email) saat ada login mencurigakan dari device/lokasi baru (nice-to-have).

**e. Broken Access Control / URL Bypass (misal akses langsung ke `/admin`)**
- Setiap route backend WAJIB divalidasi lewat middleware role/permission di server side — tidak boleh mengandalkan hide/show komponen di frontend saja.
- Middleware terpisah untuk setiap grup: `auth:superadmin`, `auth:guru`, `auth:siswa` pada route Laravel.
- Setiap request ke endpoint sensitif (approve/reject/delete/user management) wajib re-check permission di controller/policy, bukan hanya di route.
- Gunakan Laravel Policies & Gates untuk otorisasi granular per resource (misal siswa hanya boleh edit tulisan miliknya sendiri, dicek lewat `Policy`, bukan asumsi dari frontend).
- Direct Object Reference (IDOR) dicegah dengan selalu memverifikasi kepemilikan resource di backend sebelum operasi CRUD.

**f. Keamanan Tambahan**
- Paksa HTTPS di seluruh environment (HSTS header).
- Set security headers standar: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- Validasi upload file secara ketat: whitelist ekstensi (jpg, png, webp), cek MIME type asli (bukan hanya ekstensi), batasi ukuran file, simpan di storage terisolasi (bukan folder yang bisa dieksekusi sebagai script), gunakan nama file random (bukan nama asli dari user).
- Password wajib di-hash dengan bcrypt/argon2 (default Laravel), minimal panjang & kompleksitas password diatur.
- Session timeout otomatis untuk akun idle dalam waktu tertentu.
- Semua dependency (Composer & NPM package) di-scan berkala untuk vulnerability (`composer audit`, `npm audit`).
- Environment variable sensitif (`.env`) tidak boleh ter-commit ke repo, gunakan `.env.example` sebagai template.

### 7.2 Performa

- NFR-2.1: Target waktu load halaman utama mading < 2 detik pada koneksi standar (Time to Interactive).
- NFR-2.2: Implementasi caching di layer backend (Laravel Cache — Redis disarankan) untuk data yang jarang berubah (daftar kategori, tulisan populer).
- NFR-2.3: Pagination atau infinite scroll wajib untuk daftar tulisan — dilarang query/load seluruh data sekaligus.
- NFR-2.4: Eager loading relasi Eloquent (`with()`) untuk menghindari N+1 query problem.
- NFR-2.5: Optimasi gambar otomatis saat upload (resize, kompresi, konversi ke WebP) sebelum disimpan.
- NFR-2.6: Gunakan CDN atau storage terpisah (misal S3-compatible) untuk aset media, bukan disimpan langsung di server aplikasi.
- NFR-2.7: Index database pada kolom yang sering di-query/filter (status, kategori_id, user_id, created_at).
- NFR-2.8: Queue (Laravel Queue + worker) untuk proses berat seperti resize gambar dan pengiriman notifikasi, agar tidak blocking request utama.
- NFR-2.9: Frontend React menerapkan code-splitting per route dan lazy loading komponen berat.

### 7.3 Skalabilitas & Reliabilitas
- Desain database dan API dibuat modular agar modul mading bisa dipisah jadi service independen di masa depan jika beban tinggi, tanpa perlu redesain total.
- Logging terstruktur (misal Laravel log channel terpisah untuk modul mading) untuk memudahkan debugging dan monitoring.

### 7.4 UI/UX
- Desain responsif penuh (mobile-first), mengikuti breakpoint standar (mobile, tablet, desktop).
- Konsisten dengan design system aplikasi existing (warna, tipografi, komponen) agar terasa satu ekosistem dengan landing page & `/scp`.
- Aksesibilitas dasar: kontras warna sesuai WCAG AA, semua elemen interaktif bisa diakses keyboard, gambar punya `alt text`.
- Skeleton loading / loading state yang jelas saat data sedang di-fetch (bukan blank screen).
- Feedback visual jelas untuk setiap aksi (toast notification untuk sukses/gagal submit, approve, reject).
- Dashboard guru & superadmin menggunakan pola UI data-dense yang familiar (tabel dengan filter/sort, bukan card-based yang menyulitkan scanning banyak data).

### 7.5 Kompatibilitas
- Mendukung browser modern 2 versi terakhir (Chrome, Firefox, Safari, Edge).
- Tidak mendukung Internet Explorer.

---

## 8. Arsitektur & Integrasi

### 8.1 Pendekatan Umum
- **Monolith, satu database** — modul mading dikembangkan dalam project Laravel + React yang sama dengan landing page/`/scp`/PPDB.
  - Backend route: `routes/mading.php` di-load dengan prefix `/api/mading/*`
  - Frontend route: grup route baru `/mading/*` di React Router, terpisah dari `/scp/*` dan halaman publik existing
- **Auth:** menggunakan sistem auth existing (extend, bukan buat baru), dibedakan lewat role **dan** unit.
- **Database:** tabel baru dengan prefix jelas (`mading_posts`, `mading_categories`, `mading_post_status_logs`, dst) agar tidak bentrok dengan tabel PPDB/landing page yang sudah ada.
- **PPDB (2 pintu — web & Google Docs):** di luar cakupan modul ini, tidak ada dependensi teknis terhadap mading.

### 8.2 Arsitektur Multi-Unit (Multi-Tenancy) — **Bagian Kritis**

Aplikasi ini melayani **5 unit** (LPQ, TK, SD, SMP, SMK) dari **satu basis kode dan satu database**, menggunakan pola *shared database, discriminator column* — setiap baris data relevan ditandai `unit_id`. Ini dipilih dibanding database-per-unit karena skalanya kecil (5 unit) dan pengembang tunggal butuh operasional yang sesederhana mungkin.

**a. Model Data Unit**
- Tabel baru `units` menyimpan identitas tiap unit: `id`, `name` (misal "SMK Nuurul Muttaqiin"), `slug` (misal `smk`, dipakai untuk subdomain), `logo_url`, `primary_color`, `secondary_color`, `address`, `tagline`, `is_active`.
- Setiap user (`guru`, `siswa`, `admin_unit`) wajib punya `unit_id` yang mengikat dia ke satu unit. **Superadmin Yayasan tidak terikat `unit_id`** (bersifat lintas unit).
- Setiap `mading_posts` otomatis mewarisi `unit_id` dari penulisnya saat dibuat — tidak bisa diubah manual, mencegah tulisan "berpindah" unit.

**b. Strategi Routing & Domain**

| Jenis Akses | Alamat | Perilaku |
|---|---|---|
| Halaman hub/portal | `mading.nuurulmuttaqiin.or.id` | Menampilkan direktori 5 unit (logo + nama tiap unit) sebagai pintu masuk, plus opsional feed gabungan tulisan terbaru lintas unit |
| Mading publik per unit | `{slug}.mading.nuurulmuttaqiin.or.id` (misal `smk.mading.nuurulmuttaqiin.or.id`) | Menampilkan mading khusus unit tsb dengan branding penuh (logo, nama, warna) |
| Login guru/siswa/admin unit | Bisa lewat subdomain unit masing-masing, atau satu pintu login terpusat yang otomatis redirect ke subdomain unit sesuai `unit_id` user | Setelah login, seluruh UI (header, footer, favicon, warna) menyesuaikan `unit_id` milik user tsb |
| Login Superadmin Yayasan | `mading.nuurulmuttaqiin.or.id/superadmin` (di hub, bukan di subdomain unit manapun) | Dashboard lintas unit dengan selector/filter per unit |

- **Requirement infrastruktur:** wildcard DNS record (`*.mading.nuurulmuttaqiin.or.id`) dan wildcard SSL certificate. Laravel mendukung subdomain routing native lewat `Route::domain('{unit}.mading.nuurulmuttaqiin.or.id')`.
- **Resolusi tenant:** middleware kustom (`ResolveUnitFromSubdomain`) membaca subdomain di setiap request, mencocokkan ke tabel `units`, lalu inject objek unit aktif ke request context (dipakai backend untuk filter query & dipakai frontend untuk render branding).

**c. Dynamic Branding (Frontend)**
- React memakai pola **Theme Context/Provider**: saat aplikasi dimuat, fetch data unit aktif (dari subdomain atau dari `unit_id` user yang login) → set CSS custom properties (`--primary-color`, dst), ganti logo, nama sekolah di header/footer, dan `favicon`/meta title secara dinamis — **tanpa rebuild atau deploy terpisah per unit**.
- Data unit di-cache di frontend (misal via query cache) agar tidak fetch berulang tiap navigasi.

**d. Isolasi Data Antar Unit (Keamanan — lihat juga 7.1)**
- **Setiap query di backend WAJIB di-scope otomatis by `unit_id`** — disarankan pakai [Eloquent Global Scope] yang otomatis menambahkan `WHERE unit_id = ?` ke semua query model `MadingPost`, kecuali untuk role Superadmin Yayasan.
- Ini mencegah kebocoran data lintas unit (misal Admin Unit SD tidak sengaja/sengaja mengakses data siswa SMK lewat manipulasi ID di URL — termasuk dalam kategori *Broken Access Control* di bagian 7.1).
- Policy Laravel untuk tiap resource wajib cek dua hal: (1) role user, **dan** (2) apakah `unit_id` resource yang diakses sama dengan `unit_id` user (kecuali Superadmin Yayasan).

**e. Kategori: Global vs Per-Unit (Hybrid)**
- Tabel `mading_categories` punya kolom `unit_id` yang **nullable**: jika `NULL` → kategori berlaku global (dibuat oleh Superadmin Yayasan, muncul di semua unit, misal "Opini", "Prestasi"). Jika terisi → kategori eksklusif unit tsb (dibuat oleh Admin Unit, misal TK punya kategori "Cerita Bergambar" yang tidak relevan untuk SMK).
- Saat siswa memilih kategori saat menulis, sistem menampilkan gabungan kategori global + kategori khusus unitnya saja.

---

## 9. Data Model (Ringkasan Tabel Inti)

| Tabel | Deskripsi Singkat |
|---|---|
| `units` *(baru)* | Master data 5 unit: `name`, `slug`, `logo_url`, `primary_color`, `secondary_color`, `address`, `tagline`, `is_active` |
| `users` | Existing — ditambah kolom `unit_id` (nullable — `NULL` khusus untuk Superadmin Yayasan) dan relasi role via `spatie/laravel-permission` (mode teams, `unit_id` sebagai team key) |
| `roles`, `permissions`, `model_has_roles` | Standar package RBAC — role: `superadmin_yayasan`, `admin_unit`, `guru`, `siswa` |
| `mading_categories` | Kategori/rubrik tulisan — kolom `unit_id` nullable (NULL = kategori global, terisi = kategori khusus unit) |
| `mading_posts` | Konten tulisan (title, body, category_id, author_id, **unit_id** — auto-inherit dari author, status, cover_image, timestamps) |
| `mading_post_status_logs` | Riwayat perubahan status (actor_id, from_status, to_status, note, created_at) |
| `mading_notifications` | Notifikasi in-app ke user terkait status tulisan |
| `audit_logs` | Log aktivitas sensitif seluruh sistem, termasuk `unit_id` terkait (bisa dishare dengan modul lain jika sudah ada) |

*(ERD detail dan migration file disarankan dibuat oleh AI agent berdasarkan tabel di atas, mengikuti konvensi Laravel migration & foreign key constraint yang tepat.)*

> **Penting:** Tabel di atas adalah kebutuhan fungsional, **bukan perintah untuk membuat skema database dari nol**. AI agent wajib terlebih dahulu meninjau migration & tabel yang sudah ada di project (khususnya `users` dan sistem role/permission jika sudah ada), lalu **memperluas/mengintegrasikan** skema baru mengikuti struktur tersebut — lihat detail instruksi di bagian 14.

---

## 10. Role & Permission Matrix

| Aksi | Superadmin Yayasan | Admin Unit | Guru | Siswa | Publik |
|---|---|---|---|---|---|
| Buat tulisan | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit tulisan sendiri (status draft/revisi) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit tulisan orang lain | ✅ (semua unit) | ❌ | ❌ | ❌ | ❌ |
| Approve/Reject tulisan | ✅ (semua unit) | ✅ (unitnya) | ✅ (unitnya) | ❌ | ❌ |
| Hapus tulisan siapa pun | ✅ (semua unit) | ✅ (unitnya) | ❌ (hanya milik sendiri sebelum tayang) | ❌ (hanya draft sendiri) | ❌ |
| Kelola kategori global | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kelola kategori khusus unit | ✅ (semua unit) | ✅ (unitnya) | ❌ | ❌ | ❌ |
| Kelola user & role di unitnya | ✅ (semua unit) | ✅ (unitnya, kecuali menunjuk Admin Unit lain) | ❌ | ❌ | ❌ |
| Kelola data unit (logo, nama, warna, subdomain) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lihat audit log | ✅ (semua unit) | ✅ (unitnya saja) | ❌ | ❌ | ❌ |
| Baca tulisan approved | ✅ (semua unit) | ✅ (unitnya) | ✅ (unitnya) | ✅ (unitnya) | ✅ (sesuai unit yang diakses) |

---

## 11. Metrik Keberhasilan (Success Metrics)

- Waktu rata-rata dari submit hingga approve/reject < 48 jam.
- Zero critical security incident (SQL injection, XSS, unauthorized access) pasca-launch.
- Page load time halaman mading publik < 2 detik (p75).
- Adopsi: minimal X% siswa aktif submit tulisan per bulan (target ditentukan sekolah).

---

## 12. Fase Implementasi yang Disarankan (MVP → Lanjutan)

**Fase 1 (MVP) — termasuk fondasi multi-unit, tidak bisa ditunda:**
- Tabel `units` + seed data 5 unit (LPQ, TK, SD, SMP, SMK) dengan branding masing-masing
- Wildcard DNS & SSL, middleware resolusi subdomain ke unit aktif
- Auth & RBAC dasar dengan scoping unit (superadmin_yayasan, admin_unit, guru, siswa) + Eloquent Global Scope untuk isolasi data antar unit
- Dynamic branding di frontend (Theme Provider berbasis data unit)
- Halaman hub direktori unit + halaman publik mading per subdomain unit
- CRUD tulisan siswa + alur approval sederhana (approve/reject), otomatis scoped ke unit penulis
- Keamanan dasar: CSRF, rate limiting login, validasi upload, RBAC + tenant-isolation middleware di semua route

**Fase 2:**
- Fitur revisi (bukan hanya approve/reject)
- Kategori hybrid (global + khusus unit)
- Dashboard statistik Superadmin Yayasan (lintas unit) & Admin Unit (per unit)
- Notifikasi in-app
- Audit log lengkap (filterable per unit)

**Fase 3 (Nice-to-have):**
- Reaksi/like pada tulisan
- Import bulk user via CSV
- Optimasi lanjutan (CDN, queue, caching agresif) jika trafik sudah tinggi
- PWA (installable web app) dengan push notification untuk status tulisan
- QR code penghubung mading fisik ↔ digital

**Fase 4 (Pengembangan Lanjutan):**
- Portofolio digital otomatis (export PDF kumpulan tulisan approved milik siswa)
- Sistem badge/pencapaian (misal "Penulis Bulan Ini", milestone jumlah tulisan)
- Dashboard statistik personal untuk siswa (jumlah pembaca, tulisan terpopuler)
- Editorial calendar untuk guru (tema bulanan/mingguan agar konten lebih terarah)
- Akses alumni read-only ke arsip mading (tanpa hak submit)

---

## 12.1 Detail Fitur Tambahan

### a. Portofolio Digital Otomatis
Siswa dapat men-generate PDF berisi kumpulan tulisannya yang sudah approved, tersusun rapi dengan cover, daftar isi, dan metadata (tanggal, kategori). Berguna sebagai lampiran pendaftaran ekskul, beasiswa, atau portofolio ke jenjang berikutnya. Implementasi: generate PDF di background job (queue) agar tidak membebani request utama, hasil disimpan sementara dan bisa diunduh via link (expiring).

### b. Badge / Sistem Pencapaian
Penghargaan non-kompetitif berbasis kontribusi, contoh: "Tulisan Pertama", "5 Tulisan Approved", "Penulis Aktif Bulan Ini". Dirancang sebagai motivasi ringan, bukan leaderboard publik yang berpotensi menekan siswa yang kurang produktif. Ditampilkan di profil siswa masing-masing.

### c. Dashboard Statistik Personal Siswa
Setiap siswa punya halaman ringkas berisi: jumlah tulisan submit/approved/rejected, jumlah pembaca per tulisan, dan tulisan dengan performa terbaik. Membantu siswa memahami minat pembaca dan mendorong menulis lebih baik.

### d. QR Code Mading Fisik ↔ Digital
Jika sekolah masih mempertahankan mading fisik (papan tempel), tiap tulisan yang ditempel bisa disertai QR code kecil yang mengarah ke versi digitalnya — memungkinkan pembaca melanjutkan diskusi, memberi reaksi, atau membaca tulisan terkait secara digital. QR digenerate otomatis saat tulisan berstatus approved.

### e. PWA + Push Notification
Aplikasi mading di-package sebagai Progressive Web App agar bisa "diinstall" ke homescreen HP siswa/guru tanpa app store. Push notification dipakai untuk memberi tahu siswa saat tulisannya berubah status (approved/rejected/revisi), dan memberi tahu guru saat ada tulisan baru masuk antrian.

### f. Editorial Calendar (Guru)
Guru dapat menyusun kalender tema per periode (misal "Bulan Bahasa: tema kearifan lokal", "Bulan Sains: tema eksperimen"). Tema ini ditampilkan ke siswa sebagai inspirasi saat membuat tulisan baru, membantu distribusi topik agar tidak menumpuk di satu tema saja.

### g. Akses Alumni (Read-Only)
Akun dengan role baru `alumni` yang hanya bisa membaca arsip mading (tanpa hak submit/komentar), diaktifkan saat siswa lulus (perubahan role otomatis atau manual oleh superadmin). Membangun keterhubungan lulusan dengan sekolah dan menjaga arsip tulisan tetap punya pembaca jangka panjang.

---

## 13. Risiko & Asumsi

| Risiko/Asumsi | Mitigasi |
|---|---|
| Rich text editor rentan XSS jika tidak disaring dengan benar | Wajib sanitizer di backend, whitelist tag ketat |
| Upload gambar disalahgunakan untuk upload file berbahaya | Validasi MIME type asli + storage terisolasi |
| Role guru disalahgunakan untuk approve tulisan sendiri tanpa review pihak lain | Pertimbangkan aturan: guru tidak bisa self-approve tulisan sendiri, wajib direview guru lain/superadmin |
| Modul mading berkembang jadi berat dan mengganggu modul lain dalam satu monolith | Arsitektur database & namespace sudah dipisah rapi sejak awal, sehingga siap dipecah jadi service terpisah bila diperlukan nanti |
| Kebocoran data antar unit (misal Admin Unit/guru satu unit bisa mengakses data unit lain lewat manipulasi ID atau bug scoping) | Wajib Eloquent Global Scope + Policy check `unit_id` di setiap resource, ditest eksplisit dengan test case lintas unit (lihat 14) |
| Wildcard SSL/DNS belum tersedia saat mulai development, menghambat testing subdomain | Untuk environment dev/staging, bisa disimulasikan dengan `/etc/hosts` lokal atau path-based routing sementara sebelum DNS wildcard production siap |
| Unit baru ditambahkan di masa depan (misal yayasan buka unit ke-6) tanpa perubahan besar di sistem | Karena semua data sudah di-scope `unit_id` sejak awal, menambah unit baru cukup insert baris baru di tabel `units`, tanpa migrasi struktural |

---

## 14. Catatan untuk AI Coding Agent

- **Wajib periksa struktur database existing terlebih dahulu** (tabel `users`, migration yang sudah ada, relasi yang sudah dipakai `/scp` & PPDB) sebelum membuat tabel baru. Tabel dan kolom pada bagian 9 (Data Model) di dokumen ini adalah **acuan kebutuhan fungsional, bukan skema final** — sesuaikan dan integrasikan dengan struktur yang sudah ada, jangan buat ulang dari nol.
  - Jika tabel `users` sudah punya kolom relevan (misal `role`, `is_active`, `nis`/NIP), **reuse** kolom tersebut, jangan duplikasi.
  - Jika sistem role/permission sudah berjalan di `/scp` (meski sederhana), **perluas sistem itu** untuk role `guru` dan `siswa`, jangan pasang sistem RBAC kedua yang terpisah.
  - Penamaan tabel baru (`mading_*`) mengikuti konvensi/prefix yang sudah dipakai di project existing jika ada standar penamaan tersendiri.
  - Foreign key ke `users.id` (atau tabel setara) wajib mengikuti struktur yang sudah ada, bukan membuat tabel user baru.
- Sebelum membuat migration baru, jalankan `php artisan migrate:status` dan review file migration existing untuk memetakan skema yang sudah berjalan.
- Ikuti konvensi Laravel (Form Request untuk validasi, Policy untuk otorisasi, Resource untuk API response) dan konvensi React modern (functional component, hooks, code-splitting).
- Setiap endpoint baru wajib disertai middleware auth + permission check, tidak boleh mengandalkan validasi di frontend saja.
- Tulis test otomatis minimal untuk: alur approval, permission per role, validasi input rawan (SQLi/XSS payload) pada endpoint tulisan, **dan wajib ada test khusus isolasi antar unit** (misal: user unit A mencoba akses/edit resource unit B via ID manipulation harus selalu gagal/403).
- Ikuti struktur folder existing project agar konsisten dengan modul landing page/`/scp` yang sudah ada.
- **Khusus multi-tenancy:** implementasikan Eloquent Global Scope di model `MadingPost` dan `MadingCategory` yang otomatis filter berdasarkan `unit_id` context aktif, kecuali saat request datang dari role `superadmin_yayasan`. Jangan mengandalkan filter `unit_id` manual di tiap controller — rawan lupa/human error di salah satu endpoint.
- Setup wildcard subdomain routing Laravel (`Route::domain()`) di awal development, bukan belakangan — banyak keputusan struktur route dan middleware bergantung pada ini sejak awal.

---

*Dokumen ini adalah PRD tingkat produk — detail teknis implementasi (nama variabel, struktur folder pasti, pilihan package spesifik di luar yang disebutkan) diserahkan pada AI coding agent untuk dielaborasi sesuai best practice terkini.*
