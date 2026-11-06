-- Sinkronisasi PPDB -> SIM Keuangan. Idempotent: aman dijalankan berulang.
DELIMITER $$

DROP PROCEDURE IF EXISTS add_col_if_missing$$
CREATE PROCEDURE add_col_if_missing(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = tbl AND column_name = col
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN ', ddl);
    PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS add_index_if_missing$$
CREATE PROCEDURE add_index_if_missing(IN tbl VARCHAR(64), IN idx VARCHAR(64), IN ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = tbl AND index_name = idx
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD ', ddl);
    PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

CALL add_col_if_missing('ppdb_submissions', 'sync_warning', '`sync_warning` TEXT NULL');
CALL add_col_if_missing('ppdb_submissions', 'sync_error', '`sync_error` TEXT NULL');
CALL add_col_if_missing('ppdb_submissions', 'synced_at', '`synced_at` DATETIME NULL');
CALL add_col_if_missing('ppdb_submissions', 'sync_attempts', '`sync_attempts` INT NOT NULL DEFAULT 0');
CALL add_col_if_missing('ppdb_submissions', 'sync_external_id', '`sync_external_id` VARCHAR(64) NULL');
CALL add_index_if_missing('ppdb_submissions', 'idx_ppdb_sync_status', 'INDEX `idx_ppdb_sync_status` (`sync_status`)');
CALL add_index_if_missing('ppdb_submissions', 'idx_ppdb_status_sync', 'INDEX `idx_ppdb_status_sync` (`status`, `sync_status`)');

CREATE TABLE IF NOT EXISTS ppdb_sync_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ppdb_id INT NOT NULL,
  action VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ppdb_sync_logs_ppdb (ppdb_id)
);

DROP PROCEDURE IF EXISTS add_col_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;
