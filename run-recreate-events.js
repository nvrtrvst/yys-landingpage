const mysql = require('mysql2/promise');
async function run() {
  try {
    const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', password: '', database: 'yayasan_db' });
    await pool.query('DROP TABLE IF EXISTS events');
    await pool.query(`
      CREATE TABLE events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        location VARCHAR(255),
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Events table recreated successfully.');
    pool.end();
  } catch (error) {
    console.error(error);
  }
}
run();
