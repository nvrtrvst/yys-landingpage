-- Adds per-user module permissions for the petugas role. Safe to run repeatedly.
DELIMITER $$

DROP PROCEDURE IF EXISTS add_user_permissions_col$$
CREATE PROCEDURE add_user_permissions_col()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE users ADD COLUMN permissions JSON NULL AFTER role;
  END IF;
END$$

DELIMITER ;

CALL add_user_permissions_col();

DROP PROCEDURE IF EXISTS add_user_permissions_col;
