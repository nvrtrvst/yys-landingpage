-- Sinkronisasi kelas dari SIM Keuangan ke PPDB. Idempotent: aman dijalankan berulang.
DELIMITER $$

DROP PROCEDURE IF EXISTS add_ppdb_class_col$$
CREATE PROCEDURE add_ppdb_class_col(IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'ppdb_submissions' AND column_name = col
  ) THEN
    SET @s = CONCAT('ALTER TABLE ppdb_submissions ADD COLUMN ', ddl);
    PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

CALL add_ppdb_class_col('sync_class_id', '`sync_class_id` VARCHAR(64) NULL');
CALL add_ppdb_class_col('sync_class_name', '`sync_class_name` VARCHAR(100) NULL');

DROP PROCEDURE IF EXISTS add_ppdb_class_col;
