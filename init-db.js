const fs = require('fs');
const mysql = require('mysql2/promise');

async function initDB() {
  try {
    // Connect without database selected first to create it
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      multipleStatements: true // This allows running multiple queries from a file
    });

    console.log("Connected to MySQL server.");

    // Create database
    await connection.query("CREATE DATABASE IF NOT EXISTS yayasan_db;");
    console.log("Database yayasan_db created or already exists.");

    // Switch to database
    await connection.query("USE yayasan_db;");

    // Read and execute schema
    const schemaSql = fs.readFileSync('schema.sql', 'utf8');
    await connection.query(schemaSql);
    console.log("Schema imported successfully.");

    // Read and execute seed
    const seedSql = fs.readFileSync('seed.sql', 'utf8');
    await connection.query(seedSql);
    console.log("Seed data imported successfully.");

    await connection.end();
    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initDB();
