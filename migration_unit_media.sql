SET @add_carousel = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE units ADD COLUMN carousel_images JSON NULL AFTER programs_background',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME = 'carousel_images'
);
PREPARE stmt FROM @add_carousel;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_youtube = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE units ADD COLUMN youtube_url VARCHAR(255) NULL AFTER carousel_images',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME = 'youtube_url'
);
PREPARE stmt FROM @add_youtube;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
