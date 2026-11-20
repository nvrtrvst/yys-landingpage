-- Scope konten (berita, agenda, testimoni) ke unit tertentu atau Yayasan (NULL = global/yayasan)
-- Idempotent: gunakan IF NOT EXISTS via INFORMATION_SCHEMA checks manual (jalankan sekali).

ALTER TABLE news
  ADD COLUMN unit_id INT NULL AFTER id,
  ADD CONSTRAINT fk_news_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

ALTER TABLE events
  ADD COLUMN unit_id INT NULL AFTER id,
  ADD CONSTRAINT fk_events_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

ALTER TABLE testimonials
  ADD COLUMN unit_id INT NULL AFTER id,
  ADD CONSTRAINT fk_testimonials_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- Index untuk filter cepat
CREATE INDEX idx_news_unit ON news(unit_id);
CREATE INDEX idx_events_unit ON events(unit_id);
CREATE INDEX idx_testimonials_unit ON testimonials(unit_id);
