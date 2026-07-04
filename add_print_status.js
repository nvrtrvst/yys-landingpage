const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool('mysql://root:@127.0.0.1:3306/yayasan_db');

    try {
        await pool.execute('ALTER TABLE ppdb_submissions ADD COLUMN is_printed TINYINT(1) DEFAULT 0');
        console.log('Migration successful');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
             console.log('Column already exists');
        } else {
             console.error('Migration failed', e);
        }
    } finally {
        await pool.end();
    }
}
run();
