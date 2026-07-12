-- Tambah unique index pada slug mading_posts.
-- JALANKAN SETELAH backfill slug selesai (semua baris punya slug unik, tanpa NULL).

ALTER TABLE mading_posts ADD UNIQUE INDEX uk_mading_posts_slug (slug);
