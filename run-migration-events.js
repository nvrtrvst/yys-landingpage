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
      CREATE TABLE IF NOT EXISTS events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          start_date DATETIME NOT NULL,
          end_date DATETIME NOT NULL,
          location VARCHAR(255),
          image_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(sql);
    console.log("Migration Events executed successfully.");

    await connection.end();
  } catch (error) {
    console.error("Error running migration:", error);
  }
}

runMigration();
