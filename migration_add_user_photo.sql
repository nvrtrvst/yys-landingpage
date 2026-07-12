-- Tambah kolom photo ke users (foto profil mading siswa/guru)
ALTER TABLE users ADD COLUMN photo VARCHAR(255) NULL AFTER email;
