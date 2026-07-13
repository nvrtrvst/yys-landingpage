-- Moderasi komentar mading: flag komentar kasar & trace ke identitas asli

ALTER TABLE mading_comments
  ADD COLUMN is_flagged TINYINT(1) NOT NULL DEFAULT 0 AFTER content,
  ADD COLUMN flag_reason VARCHAR(50) NULL AFTER is_flagged,
  ADD COLUMN moderated_at DATETIME NULL AFTER flag_reason,
  ADD COLUMN moderated_by INT NULL AFTER moderated_at,
  ADD INDEX idx_flagged (is_flagged);
