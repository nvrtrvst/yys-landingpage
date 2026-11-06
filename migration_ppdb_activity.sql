-- PPDB activity history plus fast "last changed" columns. Safe to run repeatedly.
DELIMITER $$

DROP PROCEDURE IF EXISTS add_ppdb_activity_col$$
CREATE PROCEDURE add_ppdb_activity_col(IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'ppdb_submissions' AND column_name = col
  ) THEN
    SET @s = CONCAT('ALTER TABLE ppdb_submissions ADD COLUMN ', ddl);
    PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS add_ppdb_activity_idx$$
CREATE PROCEDURE add_ppdb_activity_idx(IN tbl VARCHAR(64), IN idx VARCHAR(64), IN ddl TEXT)
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

CALL add_ppdb_activity_col('updated_at', '`updated_at` DATETIME NULL');
CALL add_ppdb_activity_col('updated_by_name', '`updated_by_name` VARCHAR(255) NULL');
CALL add_ppdb_activity_col('last_action', '`last_action` VARCHAR(50) NULL');

CREATE TABLE IF NOT EXISTS ppdb_activity_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ppdb_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  field VARCHAR(50) NULL,
  old_value VARCHAR(255) NULL,
  new_value VARCHAR(255) NULL,
  note TEXT NULL,
  actor_id INT NULL,
  actor_name VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ppdb_activity_ppdb (ppdb_id, created_at),
  INDEX idx_ppdb_activity_created (created_at)
);

CALL add_ppdb_activity_idx('ppdb_submissions', 'idx_ppdb_created_at', 'INDEX `idx_ppdb_created_at` (`created_at`)');
CALL add_ppdb_activity_idx('ppdb_submissions', 'idx_ppdb_unit', 'INDEX `idx_ppdb_unit` (`unit`)');
CALL add_ppdb_activity_idx('ppdb_submissions', 'idx_ppdb_status', 'INDEX `idx_ppdb_status` (`status`)');
CALL add_ppdb_activity_idx('ppdb_submissions', 'idx_ppdb_updated_at', 'INDEX `idx_ppdb_updated_at` (`updated_at`)');

DROP PROCEDURE IF EXISTS add_ppdb_activity_col;
DROP PROCEDURE IF EXISTS add_ppdb_activity_idx;
