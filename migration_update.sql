-- Update units table
ALTER TABLE units 
ADD COLUMN content LONGTEXT AFTER description,
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER map_coordinates;

-- Update programs table
ALTER TABLE programs
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER order_index;

-- Add map setting
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('map_embed_url', '');
