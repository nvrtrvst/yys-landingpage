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
      CREATE TABLE IF NOT EXISTS galleries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NULL,
          image_url VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(sql);
    console.log("Migration Galleries executed successfully.");

    await connection.end();
  } catch (error) {
    console.error("Error running migration:", error);
  }
}

runMigration();
