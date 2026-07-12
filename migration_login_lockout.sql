-- Migrasi: kolom lockout brute-force untuk tabel users
-- Jalankan manual di server production (copy-paste ke MySQL client).
-- Idempoten: aman dijalankan berulang kali (tidak error jika kolom sudah ada).

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'failed_attempts');
SET @sql = IF(@col = 0, 'ALTER TABLE users ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0, ADD COLUMN locked_until DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
