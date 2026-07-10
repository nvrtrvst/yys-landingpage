-- Migrasi: kolom lockout brute-force untuk tabel users
-- Jalankan manual di server production (copy-paste ke MySQL client).

ALTER TABLE users
  ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN locked_until DATETIME NULL;
