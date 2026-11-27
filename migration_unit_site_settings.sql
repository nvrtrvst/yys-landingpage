SET @add_hero_title = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE units ADD COLUMN hero_title VARCHAR(255) NULL AFTER tagline',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME = 'hero_title'
);
PREPARE stmt FROM @add_hero_title;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_hero_subtitle = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE units ADD COLUMN hero_subtitle TEXT NULL AFTER hero_title',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME = 'hero_subtitle'
);
PREPARE stmt FROM @add_hero_subtitle;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_og_image = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE units ADD COLUMN og_image VARCHAR(255) NULL AFTER logo_url',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME = 'og_image'
);
PREPARE stmt FROM @add_og_image;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_updated_at = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE units ADD COLUMN updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME = 'updated_at'
);
PREPARE stmt FROM @add_updated_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE units MODIFY COLUMN updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6);
