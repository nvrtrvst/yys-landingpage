SET @add_col = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE galleries ADD COLUMN unit_id INT NULL AFTER title',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'galleries' AND COLUMN_NAME = 'unit_id'
);
PREPARE stmt FROM @add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_index = (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX idx_galleries_unit_id ON galleries(unit_id)',
    'SELECT 1')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'galleries' AND INDEX_NAME = 'idx_galleries_unit_id'
);
PREPARE stmt FROM @add_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
