SET @add_unit_ppdb_config = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE units ADD COLUMN ppdb_config JSON NULL AFTER wa_message',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME = 'ppdb_config'
);
PREPARE stmt FROM @add_unit_ppdb_config;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
