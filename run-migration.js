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

    const migrationSql = fs.readFileSync('migration_update.sql', 'utf8');
    await connection.query(migrationSql);
    console.log("Migration executed successfully.");

    await connection.end();
  } catch (error) {
    console.error("Error running migration:", error);
  }
}

runMigration();
