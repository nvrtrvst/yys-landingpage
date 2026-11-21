DROP PROCEDURE IF EXISTS add_unit_site_columns;
DELIMITER //
CREATE PROCEDURE add_unit_site_columns()
BEGIN
  DECLARE col_name VARCHAR(64);
  DECLARE col_def TEXT;
  DECLARE done INT DEFAULT 0;
  DECLARE cur CURSOR FOR
    SELECT col, def FROM (
      SELECT 'history_html' AS col, 'LONGTEXT NULL' AS def
      UNION ALL SELECT 'vision', 'VARCHAR(500) NULL'
      UNION ALL SELECT 'mission', 'TEXT NULL'
      UNION ALL SELECT 'profile_image', 'VARCHAR(255) NULL'
      UNION ALL SELECT 'stat_students', 'VARCHAR(50) NULL'
      UNION ALL SELECT 'stat_founded', 'VARCHAR(10) NULL'
      UNION ALL SELECT 'hero_background', 'VARCHAR(255) NULL'
      UNION ALL SELECT 'programs_background', 'VARCHAR(255) NULL'
      UNION ALL SELECT 'contact_email', 'VARCHAR(150) NULL'
      UNION ALL SELECT 'social_instagram', 'VARCHAR(255) NULL'
      UNION ALL SELECT 'social_facebook', 'VARCHAR(255) NULL'
      UNION ALL SELECT 'social_youtube', 'VARCHAR(255) NULL'
      UNION ALL SELECT 'map_embed_url', 'VARCHAR(500) NULL'
      UNION ALL SELECT 'wa_number', 'VARCHAR(30) NULL'
      UNION ALL SELECT 'wa_message', 'VARCHAR(255) NULL'
    ) specs;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO col_name, col_def;
    IF done THEN LEAVE read_loop; END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME = col_name
    ) THEN
      SET @ddl = CONCAT('ALTER TABLE units ADD COLUMN ', col_name, ' ', col_def);
      PREPARE stmt FROM @ddl;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    END IF;
  END LOOP;
  CLOSE cur;
END//
DELIMITER ;
CALL add_unit_site_columns();
DROP PROCEDURE add_unit_site_columns;
