-- ============================================================
-- MIGRATION: Mading Online — Kategori global "Pengumuman"
-- Jalankan SETELAH migration_mading_003.sql (idempoten)
-- ============================================================

USE yayasan_db;

-- Kategori global Pengumuman hanya boleh diposting oleh guru/admin (lihat api/mading/posts)
INSERT IGNORE INTO mading_categories (name, slug, description, unit_id, is_active, order_index)
VALUES ('Pengumuman', 'pengumuman', 'Pengumuman resmi dari guru/sekolah', NULL, 1, 99);
