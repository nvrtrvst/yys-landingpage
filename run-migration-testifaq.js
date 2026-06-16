const fs = require('fs');
const mysql = require('mysql2/promise');

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'yayasan_db',
      multipleStatements: true
    });

    console.log("Connected to MySQL server.");

    const sql = `
      CREATE TABLE IF NOT EXISTS testimonials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          author_name VARCHAR(255) NOT NULL,
          role VARCHAR(255),
          content TEXT NOT NULL,
          image_url VARCHAR(255),
          order_index INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS faqs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          question VARCHAR(255) NOT NULL,
          answer TEXT NOT NULL,
          category VARCHAR(100),
          order_index INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(sql);
    console.log("Migration Testimonials & FAQs executed successfully.");

    await connection.end();
  } catch (error) {
    console.error("Error running migration:", error);
  }
}

runMigration();
