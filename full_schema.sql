-- ============================================================
--  FULL SCHEMA — Yayasan Nuurul Muttaqiin
--  Menggabungkan schema.sql + migration_update.sql
--  + tabel unit_majors yang tidak ada di schema asli
--  Jalankan SEKALI di database kosong baru.
-- ============================================================

CREATE DATABASE IF NOT EXISTS yayasan_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yayasan_db;

-- ============================================================
-- 1. Users (Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50) DEFAULT 'admin',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. Settings (Global site settings — key/value store)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    setting_key    VARCHAR(100) PRIMARY KEY,
    setting_value  TEXT
);

-- ============================================================
-- 3. Units (Unit Sekolah: LPQ, TK, SD, SMP, SMK)
-- ============================================================
CREATE TABLE IF NOT EXISTS units (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    content         LONGTEXT,
    image_url       VARCHAR(255),
    order_index     INT DEFAULT 0,
    address         TEXT,
    phone           VARCHAR(50),
    map_coordinates VARCHAR(255),
    status          ENUM('active', 'inactive') DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. Unit Majors (Jurusan per Unit — e.g. SMK)
-- ============================================================
CREATE TABLE IF NOT EXISTS unit_majors (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    unit_slug VARCHAR(100) NOT NULL,
    name      VARCHAR(255) NOT NULL,
    code      VARCHAR(50),
    INDEX idx_unit_slug (unit_slug)
);

-- ============================================================
-- 5. Programs (Program Unggulan)
-- ============================================================
CREATE TABLE IF NOT EXISTS programs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    image_url   VARCHAR(255),
    unit_id     INT NULL,
    order_index INT DEFAULT 0,
    status      ENUM('active', 'inactive') DEFAULT 'active',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- ============================================================
-- 6. Galleries (Galeri Kegiatan)
-- ============================================================
CREATE TABLE IF NOT EXISTS galleries (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(255),
    image_url  VARCHAR(255) NOT NULL,
    caption    VARCHAR(255),
    unit_id    INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- ============================================================
-- 7. Testimonials
-- ============================================================
CREATE TABLE IF NOT EXISTS testimonials (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    author_name VARCHAR(255) NOT NULL,
    role       VARCHAR(100) NOT NULL,
    content    TEXT NOT NULL,
    image_url  VARCHAR(255),
    is_active  TINYINT(1) NOT NULL DEFAULT 1,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. News & Articles
-- ============================================================
CREATE TABLE IF NOT EXISTS news (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    slug         VARCHAR(255) NOT NULL UNIQUE,
    content      LONGTEXT NOT NULL,
    cover_image  VARCHAR(255),
    category     VARCHAR(100),
    status       ENUM('draft', 'published') DEFAULT 'draft',
    published_at DATETIME NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 9. FAQs
-- ============================================================
CREATE TABLE IF NOT EXISTS faqs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    category    VARCHAR(100) NOT NULL,
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    order_index INT DEFAULT 0,
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. Events (Kalender Akademik)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    start_date  DATETIME NOT NULL,
    end_date    DATETIME,
    location    VARCHAR(255),
    image_url   VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. PPDB Submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS ppdb_submissions (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    registration_number  VARCHAR(50) NOT NULL UNIQUE,
    status               ENUM('Proses', 'Diterima', 'Ditolak') DEFAULT 'Proses',
    sync_status          ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    unit                 VARCHAR(50) NOT NULL,
    grade                VARCHAR(50) NOT NULL,
    major                VARCHAR(100),

    student_name         VARCHAR(255) NOT NULL,
    nisn                 VARCHAR(50),
    birth_place          VARCHAR(100) NOT NULL,
    birth_date           DATE NOT NULL,
    gender               ENUM('Laki-laki', 'Perempuan') NOT NULL,
    address              TEXT NOT NULL,
    child_order          INT,
    siblings_count       INT,
    previous_school      VARCHAR(255),

    father_name          VARCHAR(255) NOT NULL,
    father_job           VARCHAR(100),
    mother_name          VARCHAR(255) NOT NULL,
    mother_job           VARCHAR(100),
    guardian_name        VARCHAR(255),
    guardian_job         VARCHAR(100),
    phone                VARCHAR(50) NOT NULL,
    email                VARCHAR(255),

    student_photo        VARCHAR(255),
    kk_document          VARCHAR(255),
    birth_cert_document  VARCHAR(255),
    diploma_document     VARCHAR(255),

    is_printed           TINYINT(1) NOT NULL DEFAULT 0,

    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_unit_year (unit, created_at)
);

-- ============================================================
-- 12. Contact Messages
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    phone      VARCHAR(50),
    message    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
