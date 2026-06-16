const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function resetPassword() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      database: 'yayasan_db'
    });
    
    await connection.execute('UPDATE users SET password = ? WHERE email = ?', [hash, 'admin@yayasan.com']);
    console.log('Password berhasil diupdate di database!');
    await connection.end();
  } catch (err) {
    console.error('Gagal update password:', err);
  }
}

resetPassword();
