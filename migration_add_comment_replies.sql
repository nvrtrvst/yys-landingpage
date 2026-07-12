-- Migration: tambah balasan (nested reply) pada komentar mading
-- Jalankan manual di MySQL prod:
ALTER TABLE mading_comments
  ADD COLUMN parent_id INT NULL DEFAULT NULL AFTER content,
  ADD INDEX idx_parent (parent_id),
  ADD CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES mading_comments(id) ON DELETE CASCADE;
