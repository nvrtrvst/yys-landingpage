-- Sinkronisasi PPDB -> SIM Keuangan (keu). Jalankan sekali saat deploy.
ALTER TABLE ppdb_submissions
  ADD COLUMN sync_warning TEXT NULL,
  ADD COLUMN sync_error TEXT NULL,
  ADD COLUMN synced_at DATETIME NULL,
  ADD COLUMN sync_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN sync_external_id VARCHAR(64) NULL;

CREATE INDEX idx_ppdb_sync_status ON ppdb_submissions (sync_status);
CREATE INDEX idx_ppdb_status_sync ON ppdb_submissions (status, sync_status);
