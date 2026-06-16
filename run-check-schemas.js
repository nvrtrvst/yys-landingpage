const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', password: '', database: 'yayasan_db' });
  const tables = ['news', 'ppdb_submissions', 'units', 'programs', 'faqs', 'testimonials'];
  for (const table of tables) {
    console.log(`\n--- ${table} ---`);
    try {
        const [rows] = await pool.query(`DESCRIBE ${table}`);
        console.log(rows.map(r => r.Field).join(', '));
    } catch (e) { console.log('not found'); }
  }
  pool.end();
}
run();
