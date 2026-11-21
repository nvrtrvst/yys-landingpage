SET @add_col = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE faqs ADD COLUMN unit_id INT NULL',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs' AND COLUMN_NAME = 'unit_id'
);
PREPARE stmt FROM @add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_index = (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX idx_faqs_unit_id ON faqs(unit_id)',
    'SELECT 1')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faqs' AND INDEX_NAME = 'idx_faqs_unit_id'
);
PREPARE stmt FROM @add_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
