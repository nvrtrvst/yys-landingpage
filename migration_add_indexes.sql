-- ============================================================
--  Migration: Add missing indexes for performance
--  Jalankan di database yang sudah ada (produksi)
-- ============================================================

-- ppdb_submissions: filter by status, unit+status
CREATE INDEX idx_ppdb_status ON ppdb_submissions (status);
CREATE INDEX idx_ppdb_unit_status_created ON ppdb_submissions (unit, status, created_at);

-- news: homepage & listing by published status
CREATE INDEX idx_news_status_published ON news (status, published_at);

-- events: agenda page sorted by start_date
CREATE INDEX idx_events_start_date ON events (start_date);

-- programs: unit detail page filter
CREATE INDEX idx_programs_unit_status_order ON programs (unit_id, status, order_index);

-- galleries: homepage recent ordering
CREATE INDEX idx_galleries_created_at ON galleries (created_at);

-- testimonials: if columns exist
SET @has_is_active := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'testimonials' AND COLUMN_NAME = 'is_active');
SET @s := IF(@has_is_active > 0, 'CREATE INDEX idx_testimonials_active_order ON testimonials (is_active, order_index)', 'SELECT 1');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
