-- Migration: tambah kolom views (jumlah pembaca) pada mading_posts
-- Jalankan manual di MySQL prod:
ALTER TABLE mading_posts
  ADD COLUMN views INT UNSIGNED NOT NULL DEFAULT 0;
