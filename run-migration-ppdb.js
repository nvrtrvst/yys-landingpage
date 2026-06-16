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
      ALTER TABLE ppdb_submissions
      ADD COLUMN status ENUM('pending', 'diterima', 'ditolak') DEFAULT 'pending',
      ADD COLUMN sync_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
      ADD COLUMN document_url VARCHAR(255) NULL;
    `;
    await connection.query(sql);
    console.log("Migration PPDB executed successfully.");

    await connection.end();
  } catch (error) {
    console.error("Error running migration:", error);
  }
}

runMigration();
