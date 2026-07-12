-- ============================================================
-- MIGRATION: Optimasi index untuk query mading & ppdb
-- Menambahkan index komposit yang sering digunakan, dan menghapus
-- index redundan (sudah tertutup oleh index baru / unique key).
-- Idempoten: aman dijalankan berulang kali.
-- ============================================================

DELIMITER $$
DROP PROCEDURE IF EXISTS add_idx$$
CREATE PROCEDURE add_idx(IN tbl VARCHAR(64), IN idx VARCHAR(64), IN def VARCHAR(512))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND INDEX_NAME = idx
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD INDEX `', idx, '` ', def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DROP PROCEDURE IF EXISTS drop_idx$$
CREATE PROCEDURE drop_idx(IN tbl VARCHAR(64), IN idx VARCHAR(64))
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND INDEX_NAME = idx
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` DROP INDEX `', idx, '`');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- Index komposit baru
CALL add_idx('mading_posts', 'idx_mp_unit_status_pub', '(unit_id, status, published_at)');
CALL add_idx('mading_posts', 'idx_mp_unit_status_upd', '(unit_id, status, updated_at)');
CALL add_idx('mading_comments', 'idx_mc_post_created', '(post_id, created_at)');
CALL add_idx('mading_notifications', 'idx_mn_user_created', '(user_id, created_at)');
CALL add_idx('ppdb_submissions', 'idx_ppdb_unit_status_printed', '(unit, status, is_printed, created_at)');
CALL add_idx('users', 'idx_users_role', '(role)');
CALL add_idx('units', 'idx_units_status', '(status)');
CALL add_idx('mading_audit_logs', 'idx_ma_unit_created', '(unit_id, created_at)');

-- Hapus redundan (setelah pengganti ditambahkan)
CALL drop_idx('mading_comments', 'idx_post');
CALL drop_idx('mading_notifications', 'idx_user');
CALL drop_idx('mading_reactions', 'idx_post');
CALL drop_idx('ppdb_submissions', 'idx_ppdb_unit_status_created');
CALL drop_idx('ppdb_submissions', 'idx_unit_year');

DROP PROCEDURE IF EXISTS add_idx;
DROP PROCEDURE IF EXISTS drop_idx;
