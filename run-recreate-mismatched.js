const mysql = require('mysql2/promise');
async function run() {
  try {
    const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', password: '', database: 'yayasan_db' });
    
    // News
    await pool.query('DROP TABLE IF EXISTS news');
    await pool.query(`
      CREATE TABLE news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content TEXT,
        image_url VARCHAR(255),
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        published_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // FAQs
    await pool.query('DROP TABLE IF EXISTS faqs');
    await pool.query(`
      CREATE TABLE faqs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question VARCHAR(255) NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100),
        order_index INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Testimonials
    await pool.query('DROP TABLE IF EXISTS testimonials');
    await pool.query(`
      CREATE TABLE testimonials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        author_name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        content TEXT NOT NULL,
        image_url VARCHAR(255),
        order_index INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables recreated successfully.');
    pool.end();
  } catch (error) {
    console.error(error);
  }
}
run();
