-- ============================================================
--  FULL SEED — Yayasan Nuurul Muttaqiin
--  Berisi SEMUA data aktual dari database produksi.
--
--  CARA PAKAI (laptop baru):
--    1. Jalankan: full_schema.sql
--    2. Jalankan: full_seed.sql
--    3. Salin folder public/uploads/dummy/ ke laptop baru
--       (gambar upload user ada di public/uploads/ — backup manual)
--
--  Gambar galeri menggunakan dummy karena file UUID upload
--  tidak bisa dibawa otomatis (harus backup manual).
-- ============================================================

USE yayasan_db;

-- ============================================================
-- USERS (admin default — password: Admin@1234)
-- bcrypt hash untuk 'Admin@1234' dengan salt rounds 12
-- GANTI PASSWORD setelah login pertama kali!
-- ============================================================
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(1, 'Super Admin', 'admin@nuurulmuttaqiin.or.id',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhcanFp8RrFD.K1qkVTBFS',
 'superadmin');

-- ============================================================
-- SETTINGS (36 kunci — semua data aktual dari database)
-- ============================================================
INSERT INTO settings (setting_key, setting_value) VALUES
('site_name',            'Yayasan Nuurul Muttaqiin'),
('site_tagline',         'Pendidikan Islam Terpadu'),
('site_logo',            '/uploads/dummy/site_logo.png'),
('hero_title',           'Membentuk Generasi <br /><span class="text-accent-default italic">Qurani &amp; Berprestasi</span>'),
('hero_subtitle',        'Yayasan Nuurul Muttaqiin menghadirkan pendidikan berkualitas dari jenjang LPQ hingga SMK dengan mengedepankan adab, ilmu, dan teknologi.'),
('hero_background',      '/uploads/dummy/hero_bg.png'),
('hero_cta_text',        'Daftar Sekarang'),
('hero_cta_link',        '/ppdb'),
('hero_secondary_text',  'Pelajari Lebih Lanjut'),
('hero_secondary_link',  '#tentang'),
('profile_image',        '/uploads/dummy/about_img.png'),
('profile_history',      ''),
('profile_vision',       ''),
('profile_mission',      ''),
('stat_students',        '1.2K+'),
('stat_founded',         '2005'),
('programs_background',  '/uploads/dummy/programs_bg.png'),
('contact_address',      'Jl. Pendidikan No. 1, Kota Islam'),
('contact_phone',        '081234567890'),
('contact_email',        'info@nuurulmuttaqiin.or.id'),
('social_instagram',     ''),
('social_facebook',      ''),
('social_youtube',       ''),
('wa_number',            '6281234567890'),
('wa_message',           'Halo Admin Yayasan Nuurul Muttaqiin, saya ingin bertanya...'),
('recaptcha_site',       ''),
('recaptcha_secret',     ''),
('map_embed_url',        ''),
('yayasan_name',         'Yayasan Nuurul Muttaqiin'),
('yayasan_address',      'Jl. Pendidikan No. 1, Kota Islam'),
('yayasan_phone',        '081234567890'),
('yayasan_email',        'info@nuurulmuttaqiin.or.id'),
('whatsapp_number',      '6281234567890'),
('facebook_url',         'https://facebook.com/nuurulmuttaqiin'),
('instagram_url',        'https://instagram.com/nuurulmuttaqiin'),
('youtube_url',          'https://youtube.com/nuurulmuttaqiin')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- ============================================================
-- UNITS (5 unit sekolah aktif)
-- ============================================================
INSERT INTO units (id, name, slug, description, content, image_url, order_index, address, phone, map_coordinates, status) VALUES
(1, 'LPQ Nuurul Muttaqiin', 'lpq',
 'Lembaga Pendidikan Al-Quran untuk usia dini dan anak-anak.',
 NULL, '/uploads/dummy/unit_lpq.png', 1, 'Kompleks Yayasan', '08111111', NULL, 'active'),
(2, 'TK Nuurul Muttaqiin', 'tk',
 'Taman Kanak-Kanak Islam Terpadu dengan pendekatan bermain sambil belajar.',
 NULL, '/uploads/dummy/unit_tk.png', 2, 'Kompleks Yayasan', '08111112', NULL, 'active'),
(3, 'SD Nuurul Muttaqiin', 'sd',
 'Sekolah Dasar Islam Terpadu yang mengedepankan adab dan ilmu.',
 NULL, '/uploads/dummy/unit_sd.png', 3, 'Kompleks Yayasan', '08111113', NULL, 'active'),
(4, 'SMP Nuurul Muttaqiin', 'smp',
 'Sekolah Menengah Pertama dengan program tahfidz unggulan.',
 NULL, '/uploads/dummy/unit_smp.png', 4, 'Kompleks Yayasan', '08111114', NULL, 'active'),
(5, 'SMK Nuurul Muttaqiin', 'smk',
 'Sekolah Menengah Kejuruan berwawasan global berlandaskan Islam.',
 NULL, '/uploads/dummy/unit_smk.png', 5, 'Kompleks Yayasan', '08111115', NULL, 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name), slug = VALUES(slug), description = VALUES(description),
  image_url = VALUES(image_url), order_index = VALUES(order_index),
  address = VALUES(address), phone = VALUES(phone), status = VALUES(status);

-- ============================================================
-- UNIT MAJORS (jurusan SMK)
-- ============================================================
INSERT INTO unit_majors (id, unit_slug, name, code) VALUES
(1, 'smk', 'Teknik Komputer dan Jaringan', 'TKJ'),
(2, 'smk', 'Multimedia', 'MM'),
(3, 'smk', 'Akuntansi', 'AKT')
ON DUPLICATE KEY UPDATE name = VALUES(name), code = VALUES(code);

-- ============================================================
-- PROGRAMS (3 program unggulan)
-- ============================================================
INSERT INTO programs (id, title, description, image_url, unit_id, order_index, status) VALUES
(1, 'Tahfidz Al-Quran',
 'Program hafalan Al-Quran dengan target mutqin bagi seluruh siswa mulai dari SD hingga SMK.',
 '/uploads/dummy/prog_tahfidz.png', NULL, 1, 'active'),
(2, 'Bilingual Environment',
 'Pembiasaan bahasa Arab dan Inggris dalam percakapan sehari-hari di lingkungan sekolah.',
 '/uploads/dummy/prog_bilingual.png', NULL, 2, 'active'),
(3, 'Islamic Character Building',
 'Pembentukan karakter Islami melalui pembiasaan ibadah sunnah dan adab sehari-hari.',
 '/uploads/dummy/prog_character.png', NULL, 3, 'active')
ON DUPLICATE KEY UPDATE
  title = VALUES(title), description = VALUES(description),
  image_url = VALUES(image_url), status = VALUES(status);

-- ============================================================
-- TESTIMONIALS (2 testimoni)
-- ============================================================
INSERT INTO testimonials (id, name, role, content, image_url) VALUES
(1, 'Bapak Budi', 'Wali Murid SD',
 'Alhamdulillah, anak saya menjadi lebih mandiri dan rajin sholat semenjak bersekolah di sini.',
 NULL),
(2, 'Ibu Siti', 'Wali Murid SMP',
 'Program tahfidznya sangat bagus, guru-gurunya juga sangat perhatian terhadap perkembangan siswa.',
 NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), content = VALUES(content);

-- ============================================================
-- FAQs (3 pertanyaan)
-- ============================================================
INSERT INTO faqs (id, category, question, answer, order_index) VALUES
(1, 'Pendaftaran', 'Bagaimana cara mendaftar?',
 'Pendaftaran dapat dilakukan secara online melalui website ini pada menu PPDB.',
 1),
(2, 'Pendaftaran', 'Kapan pendaftaran dibuka?',
 'Pendaftaran dibuka mulai bulan Januari hingga kuota terpenuhi.',
 2),
(3, 'Biaya', 'Berapa biaya pendaftarannya?',
 'Biaya pendaftaran bervariasi sesuai unit sekolah. Detailnya ada di brosur PPDB.',
 1)
ON DUPLICATE KEY UPDATE question = VALUES(question), answer = VALUES(answer);

-- ============================================================
-- NEWS (2 berita yang sudah published)
-- ============================================================
INSERT INTO news (id, title, slug, content, cover_image, status, published_at) VALUES
(5, 'Penerimaan Peserta Didik Baru Tahun Ajaran Depan',
 'ppdb-tahun-ajaran-depan',
 '<p>Kami membuka pendaftaran untuk tahun ajaran baru. Silakan mendaftar melalui halaman PPDB.</p>',
 NULL, 'published', '2026-06-13 18:50:04'),
(6, 'Prestasi Lomba Tahfidz Tingkat Provinsi',
 'prestasi-lomba-tahfidz-provinsi',
 '<p>Alhamdulillah siswa kami berhasil meraih juara 1 pada lomba tahfidz tingkat provinsi.</p>',
 NULL, 'published', '2026-06-13 18:50:04')
ON DUPLICATE KEY UPDATE
  title = VALUES(title), content = VALUES(content), status = VALUES(status);

-- ============================================================
-- GALLERIES (menggunakan gambar dummy karena file upload
--  aktual tidak bisa dibawa otomatis antar laptop.
--  Setelah pindah laptop, upload ulang gambar via admin panel
--  atau restore dari backup public/uploads/)
-- ============================================================
INSERT INTO galleries (title, image_url) VALUES
('Kegiatan Tahfidz',    '/uploads/dummy/gallery_1.png'),
('Kegiatan Rutin',      '/uploads/dummy/gallery_2.png'),
('Gedung Sekolah',      '/uploads/dummy/gallery_3.png'),
('Kegiatan Siswa',      '/uploads/dummy/gallery_4.png'),
('Kegiatan Siswa',      '/uploads/dummy/gallery_5.png'),
('Kegiatan Siswa',      '/uploads/dummy/gallery_6.png');

-- ============================================================
-- SELESAI
-- Jalankan: full_schema.sql lalu full_seed.sql
-- Admin default: admin@nuurulmuttaqiin.or.id / Admin@1234
-- SEGERA ganti password setelah login pertama!
-- ============================================================
