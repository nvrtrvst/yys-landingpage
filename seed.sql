USE yayasan_db;

-- 1. Insert Admin User (password is 'password123')
INSERT INTO users (name, email, password, role) VALUES 
('Super Admin', 'admin@yayasan.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiNb/NmA/Snjf0XcgX.DhOZjEQJ5R.', 'admin');

-- 2. Insert Settings
INSERT INTO settings (setting_key, setting_value) VALUES 
('yayasan_name', 'Yayasan Nuurul Muttaqiin'),
('yayasan_address', 'Jl. Pendidikan No. 1, Kota Islam'),
('yayasan_phone', '081234567890'),
('yayasan_email', 'info@nuurulmuttaqiin.or.id'),
('whatsapp_number', '6281234567890'),
('facebook_url', 'https://facebook.com/nuurulmuttaqiin'),
('instagram_url', 'https://instagram.com/nuurulmuttaqiin'),
('youtube_url', 'https://youtube.com/nuurulmuttaqiin');

-- 3. Insert Units
INSERT INTO units (name, slug, description, image_url, order_index, address, phone) VALUES 
('LPQ Nuurul Muttaqiin', 'lpq', 'Lembaga Pendidikan Al-Quran untuk usia dini dan anak-anak.', '/images/units/lpq.jpg', 1, 'Kompleks Yayasan', '08111111'),
('TK Nuurul Muttaqiin', 'tk', 'Taman Kanak-Kanak Islam Terpadu dengan pendekatan bermain sambil belajar.', '/images/units/tk.jpg', 2, 'Kompleks Yayasan', '08111112'),
('SD Nuurul Muttaqiin', 'sd', 'Sekolah Dasar Islam Terpadu yang mengedepankan adab dan ilmu.', '/images/units/sd.jpg', 3, 'Kompleks Yayasan', '08111113'),
('SMP Nuurul Muttaqiin', 'smp', 'Sekolah Menengah Pertama dengan program tahfidz unggulan.', '/images/units/smp.jpg', 4, 'Kompleks Yayasan', '08111114'),
('SMK Nuurul Muttaqiin', 'smk', 'Sekolah Menengah Kejuruan berwawasan global berlandaskan Islam.', '/images/units/smk.jpg', 5, 'Kompleks Yayasan', '08111115');

-- 4. Insert Programs
INSERT INTO programs (title, description, image_url, order_index) VALUES 
('Tahfidz Al-Quran', 'Program hafalan Al-Quran dengan target mutqin bagi seluruh siswa mulai dari SD hingga SMK.', '/images/programs/tahfidz.jpg', 1),
('Bilingual Environment', 'Pembiasaan bahasa Arab dan Inggris dalam percakapan sehari-hari di lingkungan sekolah.', '/images/programs/bilingual.jpg', 2),
('Islamic Character Building', 'Pembentukan karakter Islami melalui pembiasaan ibadah sunnah dan adab sehari-hari.', '/images/programs/character.jpg', 3);

-- 5. Insert Testimonials
INSERT INTO testimonials (name, role, content) VALUES 
('Bapak Budi', 'Wali Murid SD', 'Alhamdulillah, anak saya menjadi lebih mandiri dan rajin sholat semenjak bersekolah di sini.'),
('Ibu Siti', 'Wali Murid SMP', 'Program tahfidznya sangat bagus, guru-gurunya juga sangat perhatian terhadap perkembangan siswa.');

-- 6. Insert News
INSERT INTO news (title, slug, content, status, published_at) VALUES 
('Penerimaan Peserta Didik Baru Tahun Ajaran Depan', 'ppdb-tahun-ajaran-depan', '<p>Kami membuka pendaftaran untuk tahun ajaran baru. Silakan mendaftar melalui halaman PPDB.</p>', 'published', NOW()),
('Prestasi Lomba Tahfidz Tingkat Provinsi', 'prestasi-lomba-tahfidz-provinsi', '<p>Alhamdulillah siswa kami berhasil meraih juara 1 pada lomba tahfidz tingkat provinsi.</p>', 'published', NOW());

-- 7. Insert FAQs
INSERT INTO faqs (category, question, answer, order_index) VALUES 
('Pendaftaran', 'Bagaimana cara mendaftar?', 'Pendaftaran dapat dilakukan secara online melalui website ini pada menu PPDB.', 1),
('Pendaftaran', 'Kapan pendaftaran dibuka?', 'Pendaftaran dibuka mulai bulan Januari hingga kuota terpenuhi.', 2),
('Biaya', 'Berapa biaya pendaftarannya?', 'Biaya pendaftaran bervariasi sesuai unit sekolah. Detailnya ada di brosur PPDB.', 1);
