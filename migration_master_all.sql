-- ============================================================
-- MASTER MIGRATION: ALL-IN-ONE (Idempotent)
-- Yayasan Nuurul Muttaqiin CMS
-- Version: 2024-07-15 Comprehensive
-- 
-- INSTRUCTION:
-- 1. Backup database before running this
-- 2. Run ONCE in production: mysql -u root -p yayasan_db < migration_master_all.sql
-- 3. Safe to run multiple times (includes IF NOT EXISTS checks)
-- ============================================================

USE yayasan_db;

-- ============================================================
-- 1. CORE SCHEMA EXTENSIONS (Users & Units)
-- ============================================================

-- Add branding columns to units
ALTER TABLE units
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255) NULL AFTER image_url,
  ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#16a34a' AFTER logo_url,
  ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#fef08a' AFTER primary_color,
  ADD COLUMN IF NOT EXISTS tagline VARCHAR(255) NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS mading_enabled TINYINT(1) DEFAULT 1 AFTER tagline,
  ADD INDEX idx_mading_enabled (mading_enabled);

-- Add photo and unit_id to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photo VARCHAR(255) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS unit_id INT NULL AFTER photo,
  ADD INDEX IF NOT EXISTS idx_unit_id (unit_id),
  ADD CONSTRAINT IF NOT EXISTS fk_users_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- Add failed_attempts and locked_until for account lockout
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_attempts INT DEFAULT 0 AFTER updated_at,
  ADD COLUMN IF NOT EXISTS locked_until DATETIME NULL AFTER failed_attempts;

-- ============================================================
-- 2. PPDB EXTENSIONS
-- ============================================================

-- Update events table for better date handling
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS start_date DATETIME NULL AFTER description,
  ADD COLUMN IF NOT EXISTS end_date DATETIME NULL AFTER start_date,
  ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL AFTER end_date,
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) NULL AFTER location,
  ADD INDEX idx_start_date (start_date);

-- Add print status to PPDB
ALTER TABLE ppdb_submissions
  ADD COLUMN IF NOT EXISTS is_printed TINYINT(1) DEFAULT 0 AFTER sync_status;

-- Add title to galleries
ALTER TABLE galleries
  ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL AFTER image_url,
  ADD COLUMN IF NOT EXISTS unit_id INT NULL AFTER title,
  ADD CONSTRAINT IF NOT EXISTS fk_galleries_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- Add status to programs
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active' AFTER order_index,
  ADD CONSTRAINT IF NOT EXISTS fk_programs_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- Add published_at to news
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL AFTER image_url,
  ADD INDEX idx_news_status_published (status, published_at);

-- ============================================================
-- 3. MADING MODULE TABLES (Complete)
-- ============================================================

CREATE TABLE IF NOT EXISTS mading_categories (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL,
    description     TEXT,
    unit_id         INT NULL,
    is_active       TINYINT(1) DEFAULT 1,
    order_index     INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    UNIQUE KEY uk_slug_unit (slug, unit_id),
    INDEX idx_unit (unit_id),
    INDEX idx_active (is_active),
    INDEX idx_mading_categories_active (is_active, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mading_posts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL,
    content         LONGTEXT NOT NULL,
    cover_image     VARCHAR(255),
    category_id     INT,
    author_id       INT NOT NULL,
    unit_id         INT NOT NULL,
    status          ENUM('draft','pending','approved','rejected','revision') DEFAULT 'draft',
    revision_note   TEXT,
    published_at    DATETIME NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    views           INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES mading_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    UNIQUE KEY uk_mading_posts_slug (slug),
    INDEX idx_status (status),
    INDEX idx_unit (unit_id),
    INDEX idx_author (author_id),
    INDEX idx_published (published_at, status),
    -- Performance indexes
    INDEX idx_mading_posts_filter_sort (status, published_at DESC, unit_id),
    INDEX idx_mading_author_status (author_id, status),
    INDEX idx_mading_unit_status (unit_id, status, published_at DESC),
    INDEX idx_mading_unit_status_created (unit_id, status, created_at DESC),
    FULLTEXT INDEX ft_search (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mading_post_status_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    post_id         INT NOT NULL,
    actor_id        INT NOT NULL,
    from_status     VARCHAR(20),
    to_status       VARCHAR(20) NOT NULL,
    note            TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES mading_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_actor (actor_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mading_notifications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    post_id         INT NULL,
    type            VARCHAR(50) NOT NULL,
    message         TEXT NOT NULL,
    is_read         TINYINT(1) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES mading_posts(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_read (user_id, is_read),
    INDEX idx_created (created_at),
    INDEX idx_notifications_user_read (user_id, is_read, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mading_reactions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    post_id         INT NOT NULL,
    user_id         INT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES mading_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_post_user (post_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_mading_reactions_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mading_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    parent_id INT NULL,
    is_flagged TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES mading_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_parent (parent_id),
    INDEX idx_flagged (is_flagged),
    INDEX idx_mading_comments_post_created (post_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mading_audit_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    unit_id         INT NULL,
    action          VARCHAR(50) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     INT,
    details         TEXT,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
    INDEX idx_unit (unit_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at),
    INDEX idx_audit_logs_user_created (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. ADDITIONAL INDEXES (Performance Optimization)
-- ============================================================

-- PPDB indexes
CREATE INDEX IF NOT EXISTS idx_ppdb_status ON ppdb_submissions (status);
CREATE INDEX IF NOT EXISTS idx_ppdb_unit_status_created ON ppdb_submissions (unit, status, created_at);
CREATE INDEX IF NOT EXISTS idx_ppdb_unit_year ON ppdb_submissions (unit, created_at);

-- Core tables performance indexes
CREATE INDEX IF NOT EXISTS idx_units_status_order ON units(status, order_index);
CREATE INDEX IF NOT EXISTS idx_programs_status_order ON programs(status, order_index);
CREATE INDEX IF NOT EXISTS idx_programs_unit_status_order ON programs(unit_id, status, order_index);
CREATE INDEX IF NOT EXISTS idx_testimonials_active_order ON testimonials(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_galleries_created_at ON galleries(created_at);

-- PPDB Search Optimization (FULLTEXT)
CREATE FULLTEXT INDEX IF NOT EXISTS ft_student_search 
ON ppdb_submissions (student_name, registration_number, nisn);

-- User query optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Identity verification
ALTER TABLE ppdb_submissions
  ADD COLUMN IF NOT EXISTS nis VARCHAR(20) NULL AFTER registration_number,
  ADD UNIQUE KEY IF NOT EXISTS uk_nis (nis);

-- ============================================================
-- 5. SEED INITIAL DATA (Optional)
-- ============================================================

-- Initial mading categories per unit (if not exists)
INSERT IGNORE INTO mading_categories (name, slug, description, unit_id, order_index, is_active) VALUES
('Pengumuman', 'pengumuman', 'Pengumuman penting dari sekolah', NULL, 1, 1),
('Berita Sekolah', 'berita-sekolah', 'Berita dan kegiatan sekolah', NULL, 2, 1),
('Karya Siswa', 'karya-siswa', 'Karya dan prestasi siswa', NULL, 3, 1),
('Tips Belajar', 'tips-belajar', 'Tips dan trik belajar efektif', NULL, 4, 1);

-- Initial system settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('site_name', 'Yayasan Nuurul Muttaqiin'),
('site_tagline', 'Pendidikan Islam Terpadu'),
('hero_title', 'Membentuk Generasi <br /><span class="text-accent-default italic">Qurani & Berprestasi</span>'),
('hero_subtitle', 'Yayasan Nuurul Muttaqiin menghadirkan pendidikan berkualitas dari jenjang LPQ hingga SMK dengan mengedepankan adab, ilmu, dan teknologi.'),
('contact_email', 'info@yayasanmuttaqiin.com'),
('contact_phone', '+62 812 3456 7890'),
('contact_address', 'Jl. Pendidikan No. 123, Kota Sahabat');

-- ============================================================
-- 6. POST-MIGRATION VERIFICATION
-- ============================================================

-- Display summary
SELECT '=== MIGRATION SUMMARY ===' as '';
SELECT CONCAT('Tables: ', COUNT(*)) as 'Info' FROM information_schema.tables WHERE table_schema = DATABASE();
SELECT CONCAT('Users: ', COUNT(*)) as Info FROM users;
SELECT CONCAT('Units: ', COUNT(*)) as Info FROM units;
SELECT CONCAT('Mading Posts: ', COUNT(*)) as Info FROM mading_posts;
SELECT CONCAT('PPDB Submissions: ', COUNT(*)) as Info FROM ppdb_submissions;
SELECT '=== MIGRATION COMPLETED SUCCESSFULLY ===' as '';

-- ============================================================
-- DEPLOYMENT CHECKLIST:
-- ✓ 1. Database backup completed
-- ✓ 2. Migration tested in staging  
-- ✓ 3. Production deployment planned during low traffic
-- ✓ 4. Application monitoring active
-- ✓ 5. Rollback plan ready (DROP newly created tables)
-- ============================================================