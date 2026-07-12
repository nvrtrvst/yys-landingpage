-- ============================================================
-- SEED: Mading Online Module — Fase 1
-- Jalankan SETELAH migration_mading_001.sql
-- ============================================================

USE yayasan_db;

-- 1. Update branding units (logo_url = NULL → auto-fallback ke /{slug}.png atau /logo.png)
UPDATE units SET logo_url = NULL, primary_color = '#16a34a', secondary_color = '#fef08a', tagline = 'Mencetak Generasi Qurani Sejak Dini' WHERE slug = 'lpq';
UPDATE units SET logo_url = NULL, primary_color = '#eab308', secondary_color = '#fef9c3', tagline = 'Belajar, Bermain, Tumbuh dalam Islam' WHERE slug = 'tk';
UPDATE units SET logo_url = NULL, primary_color = '#2563eb', secondary_color = '#dbeafe', tagline = 'Dasar Kokoh untuk Masa Depan Gemilang' WHERE slug = 'sd';
UPDATE units SET logo_url = NULL, primary_color = '#7c3aed', secondary_color = '#ede9fe', tagline = 'Muda, Berprestasi, Berkarakter Islami' WHERE slug = 'smp';
UPDATE units SET logo_url = NULL, primary_color = '#dc2626', secondary_color = '#fee2e2', tagline = 'Siap Kerja, Siap Kuliah, Berakhlak Mulia' WHERE slug = 'smk';

-- 2. User demo (password semua: 'rahasia123')
INSERT INTO users (name, email, password, role, unit_id) VALUES
('Superadmin Yayasan', 'superadmin@yayasan.com', '$2b$10$og3YfG.PeVzOjEY8AYCHgO/7umoOXoyjSIT/gjbnIGASFQQ7CNiOO', 'superadmin', NULL),
('Admin Unit SD', 'admin.sd@yayasan.com', '$2b$10$og3YfG.PeVzOjEY8AYCHgO/7umoOXoyjSIT/gjbnIGASFQQ7CNiOO', 'admin_unit', 3),
('Guru SD', 'guru.sd@yayasan.com', '$2b$10$og3YfG.PeVzOjEY8AYCHgO/7umoOXoyjSIT/gjbnIGASFQQ7CNiOO', 'guru', 3),
('Siswa SD', 'siswa.sd@yayasan.com', '$2b$10$og3YfG.PeVzOjEY8AYCHgO/7umoOXoyjSIT/gjbnIGASFQQ7CNiOO', 'siswa', 3);

-- 3. Kategori Global
INSERT IGNORE INTO mading_categories (name, slug, description, unit_id, is_active, order_index) VALUES
('Opini', 'opini', 'Tulisan opini dan pandangan pribadi', NULL, 1, 1),
('Sastra', 'sastra', 'Puisi, cerpen, dan karya sastra', NULL, 1, 2),
('Prestasi', 'prestasi', 'Berbagi prestasi dan pencapaian', NULL, 1, 3),
('Pengumuman', 'pengumuman', 'Pengumuman resmi dari guru/sekolah', NULL, 1, 99);

-- 4. Kategori per unit
INSERT INTO mading_categories (name, slug, description, unit_id, is_active, order_index) VALUES
('Karya Tulis', 'karya-tulis', 'Karangan dan laporan siswa', 3, 1, 1),
('English Corner', 'english-corner', 'Tulisan Bahasa Inggris', 3, 1, 2);

-- 5. Tulisan demo
INSERT INTO mading_posts (title, content, category_id, author_id, unit_id, status, published_at) VALUES
('Eksperimen Gunung Meletus', '<p>Kami membuat gunung meletus dari baking soda dan cuka. Saat dicampur, langsung berbusa seperti lava! Ternyata ini reaksi kimia.</p>', 4, 12, 3, 'approved', NOW()),
('Puisi: Guruku Tercinta', '<p>Guruku...<br/>Kau bagaikan pelita<br/>Menerangi gelapnya ilmu</p>', 2, 12, 3, 'pending', NULL),
('My Daily Routine', '<p>Every day I wake up at 5 AM. I pray Subuh and go to school.</p>', 5, 12, 3, 'draft', NULL);

-- 6. Status logs
INSERT INTO mading_post_status_logs (post_id, actor_id, from_status, to_status, note) VALUES
(1, 11, 'draft', 'pending', 'Submit untuk review'),
(1, 11, 'pending', 'approved', 'Tulisan bagus, lanjutkan!');

-- 7. Notifikasi
INSERT INTO mading_notifications (user_id, post_id, type, message) VALUES
(12, 1, 'approved', 'Tulisan "Eksperimen Gunung Meletus" telah disetujui dan tayang!');
