USE yayasan_db;

ALTER TABLE units
  ADD COLUMN mading_enabled TINYINT(1) DEFAULT 1 AFTER status,
  ADD INDEX idx_mading_enabled (mading_enabled);

INSERT INTO settings (setting_key, setting_value) VALUES
('mading_maintenance_mode', '0'),
('mading_allow_comments', '1'),
('mading_allow_reactions', '1'),
('mading_posts_per_page', '12'),
('mading_require_review', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
