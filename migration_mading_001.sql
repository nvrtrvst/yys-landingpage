-- ============================================================
-- MIGRATION: Mading Online Module — Fase 1 (MVP)
-- Yayasan Nuurul Muttaqiin
-- Jalankan: mysql -u root -p yayasan_db < migration_mading_001.sql
-- ============================================================

USE yayasan_db;

-- 1. units — tambah kolom branding
ALTER TABLE units
  ADD COLUMN logo_url VARCHAR(255) NULL AFTER image_url,
  ADD COLUMN primary_color VARCHAR(7) DEFAULT '#16a34a' AFTER logo_url,
  ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#fef08a' AFTER primary_color,
  ADD COLUMN tagline VARCHAR(255) NULL AFTER phone;

-- 2. users — tambah unit_id
ALTER TABLE users
  ADD COLUMN unit_id INT NULL AFTER role,
  ADD INDEX idx_unit_id (unit_id),
  ADD FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- 3. mading_categories
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
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. mading_posts
CREATE TABLE IF NOT EXISTS mading_posts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
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
    FOREIGN KEY (category_id) REFERENCES mading_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_unit (unit_id),
    INDEX idx_author (author_id),
    INDEX idx_published (published_at, status),
    FULLTEXT INDEX ft_search (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. mading_post_status_logs
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

-- 6. mading_notifications
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
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. mading_reactions (Fase 3 — like sederhana, tanpa komentar)
CREATE TABLE IF NOT EXISTS mading_reactions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    post_id         INT NOT NULL,
    user_id         INT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES mading_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_post_user (post_id, user_id),
    INDEX idx_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. mading_comments (Fase 3)
CREATE TABLE IF NOT EXISTS mading_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES mading_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. mading_audit_logs (Fase 2)
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
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
