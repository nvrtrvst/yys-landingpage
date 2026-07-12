-- ============================================================
-- MIGRATION: Menyelaraskan schema dengan kode aplikasi
-- - testimonials: rename `name` -> `author_name`, tambah is_active, order_index
-- - faqs: tambah is_active
-- - ppdb_submissions: tambah is_printed
-- Idempoten: aman dijalankan berulang kali.
-- ============================================================

-- testimonials: rename legacy `name` ke `author_name` bila perlu
SET @has_name = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'testimonials' AND COLUMN_NAME = 'name');
SET @has_author = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'testimonials' AND COLUMN_NAME = 'author_name');
SET @sql = IF(@has_name = 1 AND @has_author = 0, 'ALTER TABLE testimonials CHANGE COLUMN name author_name VARCHAR(255) NOT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_t_ia = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'testimonials' AND COLUMN_NAME = 'is_active');
SET @sql = IF(@has_t_ia = 0, 'ALTER TABLE testimonials ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_t_oi = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'testimonials' AND COLUMN_NAME = 'order_index');
SET @sql = IF(@has_t_oi = 0, 'ALTER TABLE testimonials ADD COLUMN order_index INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- faqs: tambah is_active
SET @has_f_ia = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs' AND COLUMN_NAME = 'is_active');
SET @sql = IF(@has_f_ia = 0, 'ALTER TABLE faqs ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ppdb_submissions: tambah is_printed
SET @has_p_ip = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ppdb_submissions' AND COLUMN_NAME = 'is_printed');
SET @sql = IF(@has_p_ip = 0, 'ALTER TABLE ppdb_submissions ADD COLUMN is_printed TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
