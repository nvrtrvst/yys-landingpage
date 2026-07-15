-- ============================================================
-- SQL OPTIMIZATION MIGRATIONS
-- Performance improvements untuk CMS Yayasan Nuurul Muttaqiin
-- Version: 2024-07-15
-- ============================================================

-- ============================================================
-- 1. FULLTEXT Index untuk PPDB Search (HIGH IMPACT)
-- ============================================================

-- Tambah FULLTEXT index untuk fast search pada student data
ALTER TABLE ppdb_submissions 
ADD FULLTEXT INDEX ft_student_search (
    student_name, 
    registration_number, 
    nisn
) ENGINE=InnoDB;

-- ============================================================
-- 2. Composite Indexes untuk Mading Posts (HIGH IMPACT)
-- ============================================================

-- Untuk query filtering posts by status, published date, dan unit
CREATE INDEX idx_mading_posts_filter_sort 
ON mading_posts(status, published_at DESC, unit_id);

-- Untuk query filtering by author dan status
CREATE INDEX idx_mading_author_status 
ON mading_posts(author_id, status);

-- Untuk query JOIN dengan units
CREATE INDEX idx_mading_unit_status 
ON mading_posts(unit_id, status, published_at DESC);

-- ============================================================
-- 3. Missing Composite Indexes (MEDIUM IMPACT)
-- ============================================================

-- Untuk unit queries di homepage dan admin
CREATE INDEX idx_units_status_order 
ON units(status, order_index);

-- Untuk programs queries
CREATE INDEX idx_programs_status_order 
ON programs(status, order_index);

-- Untuk testimonials queries
CREATE INDEX idx_testimonials_active_order 
ON testimonials(is_active, order_index);

-- ============================================================
-- 4. Optimized Indexes untuk Stats Queries
-- ============================================================

-- Untuk mading stats grouping by unit and status
CREATE INDEX idx_mading_unit_status_created 
ON mading_posts(unit_id, status, created_at DESC);

-- ============================================================
-- 5. Index untuk User Queries
-- ============================================================

-- Email sudah unik, tapi tambah index untuk query cepat
CREATE INDEX idx_users_email 
ON users(email);

-- Index untuk user role queries
CREATE INDEX idx_users_role 
ON users(role);

-- ============================================================
-- 6. Index untuk Category Queries
-- ============================================================

-- Optimasi query mading categories
CREATE INDEX idx_mading_categories_active 
ON mading_categories(is_active, order_index);

-- ============================================================
-- 7. Index untuk Comments dan Reactions
-- ============================================================

-- Optimasi query comments dengan post filtering
CREATE INDEX idx_mading_comments_post_created 
ON mading_comments(post_id, created_at DESC);

-- Optimasi query reactions statistics
CREATE INDEX idx_mading_reactions_post 
ON mading_reactions(post_id);

-- ============================================================
-- 8. Index untuk Audit Logs dan Notifications
-- ============================================================

-- Optimasi audit log queries by user dan action
CREATE INDEX idx_audit_logs_user_created 
ON mading_audit_logs(user_id, created_at DESC);

-- Optimasi notification queries by user read status
CREATE INDEX idx_notifications_user_read 
ON mading_notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- 9. Analiza dan Optimasi Index yang Sudah Ada
-- ============================================================

-- Cek apakah index ini sudah efektif, jika duplicate/duplikasi bisa dihapus
-- Setelah implementasi, gunakan EXPLAIN untuk verifikasi

-- ============================================================
-- INSTRUKSI:
-- 1. Backup database sebelum jalankan migration ini
-- 2. Jalankan di production setelah testing di development
-- 3. Monitor query performance setelah apply
-- 4. Gunakan EXPLAIN EXTENDED untuk verifikasi index usage
-- ============================================================