const mysql = require('mysql2/promise');
async function run() {
  try {
    const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', password: '', database: 'yayasan_db' });
    await pool.query('DROP TABLE IF EXISTS galleries');
    await pool.query(`
      CREATE TABLE galleries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NULL,
        image_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Galleries table recreated successfully.');
    pool.end();
  } catch (error) {
    console.error(error);
  }
}
run();
