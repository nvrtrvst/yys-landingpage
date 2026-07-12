-- Tambah kolom slug ke mading_posts (URL berbasis slug, bukan ID numerik)
-- Jalankan manual di MySQL prod SEBELUM backfill slug.
-- Backfill (isi slug untuk post yg sudah ada) pakai script Node terpisah,
-- lalu jalankan migration_add_post_slug_unique.sql setelah backfill selesai.

ALTER TABLE mading_posts ADD COLUMN slug VARCHAR(120) NULL AFTER title;
