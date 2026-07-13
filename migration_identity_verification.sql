-- Verifikasi identitas akun mading (1 anak 1 akun)
-- NIS = kunci unik; 1 NIS = 1 akun siswa. Guru/admin boleh NULL.

ALTER TABLE users
  ADD COLUMN nis VARCHAR(50) NULL AFTER unit_id,
  ADD COLUMN class_name VARCHAR(50) NULL AFTER nis,
  ADD COLUMN identity_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER class_name,
  ADD UNIQUE KEY uk_nis (nis);
