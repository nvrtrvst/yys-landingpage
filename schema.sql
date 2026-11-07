CREATE DATABASE IF NOT EXISTS yayasan_db;
USE yayasan_db;

-- 1. Users (Admin)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Settings (Global Settings)
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT
);

-- 3. Units (Unit Sekolah)
CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    order_index INT DEFAULT 0,
    address TEXT,
    phone VARCHAR(50),
    map_coordinates VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Programs (Program Unggulan)
CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    unit_id INT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- 5. Galleries (Galeri Kegiatan)
CREATE TABLE IF NOT EXISTS galleries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    caption VARCHAR(255),
    unit_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- 6. Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. News & Activities
CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content LONGTEXT NOT NULL,
    cover_image VARCHAR(255),
    status ENUM('draft', 'published') DEFAULT 'draft',
    published_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. FAQs
CREATE TABLE IF NOT EXISTS faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INT DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Events (Kalender Akademik)
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    unit_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

-- 10. PPDB Submissions
CREATE TABLE IF NOT EXISTS ppdb_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('Proses', 'Diterima', 'Ditolak') DEFAULT 'Proses',
    unit VARCHAR(50) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    major VARCHAR(100),
    
    student_name VARCHAR(255) NOT NULL,
    nisn VARCHAR(50),
    birth_place VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender ENUM('Laki-laki', 'Perempuan') NOT NULL,
    address TEXT NOT NULL,
    child_order INT,
    siblings_count INT,
    previous_school VARCHAR(255),
    
    father_name VARCHAR(255) NOT NULL,
    father_job VARCHAR(100),
    mother_name VARCHAR(255) NOT NULL,
    mother_job VARCHAR(100),
    guardian_name VARCHAR(255),
    guardian_job VARCHAR(100),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    
    student_photo VARCHAR(255),
    kk_document VARCHAR(255),
    birth_cert_document VARCHAR(255),
    diploma_document VARCHAR(255),

    is_printed TINYINT(1) NOT NULL DEFAULT 0,
    sync_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    sync_warning TEXT,
    sync_error TEXT,
    synced_at DATETIME,
    sync_attempts INT NOT NULL DEFAULT 0,
    sync_external_id VARCHAR(64),
    sync_class_id VARCHAR(64),
    sync_class_name VARCHAR(100),
    updated_at DATETIME NULL,
    updated_by_name VARCHAR(255) NULL,
    last_action VARCHAR(50) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_status (sync_status),
    INDEX idx_status_sync (status, sync_status),
    INDEX idx_ppdb_created_at (created_at),
    INDEX idx_ppdb_unit (unit),
    INDEX idx_ppdb_status (status),
    INDEX idx_ppdb_updated_at (updated_at)
);

CREATE TABLE IF NOT EXISTS ppdb_sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ppdb_id INT NOT NULL,
    action VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_log_ppdb (ppdb_id)
);

CREATE TABLE IF NOT EXISTS ppdb_activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ppdb_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    field VARCHAR(50) NULL,
    old_value VARCHAR(255) NULL,
    new_value VARCHAR(255) NULL,
    note TEXT NULL,
    actor_id INT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ppdb_activity_ppdb (ppdb_id, created_at),
    INDEX idx_ppdb_activity_created (created_at)
);

-- 11. Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
