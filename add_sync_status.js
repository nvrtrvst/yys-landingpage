const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection('mysql://root:@127.0.0.1:3306/yayasan_db');
    
    // Check if column exists first
    const [columns] = await connection.execute("SHOW COLUMNS FROM ppdb_submissions LIKE 'sync_status'");
    
    if (columns.length === 0) {
      console.log('Adding sync_status column to ppdb_submissions...');
      await connection.execute("ALTER TABLE ppdb_submissions ADD COLUMN sync_status ENUM('pending', 'success', 'failed') DEFAULT 'pending' AFTER status");
      console.log('Column added successfully.');
    } else {
      console.log('Column sync_status already exists.');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

main();
