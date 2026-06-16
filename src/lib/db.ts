import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2/promise';
const dbConfig = {
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Global is used here to maintain a cached connection across hot reloads
// in development. This prevents connections multiplying exponentially.
let pool: mysql.Pool;

declare global {
  var mysqlPool: mysql.Pool | undefined;
}

if (!global.mysqlPool) {
  // Extract user, password, host, port, database from URI or use direct uri
  if (process.env.DATABASE_URL) {
      global.mysqlPool = mysql.createPool(dbConfig);
  } else {
      global.mysqlPool = mysql.createPool({
          host: 'localhost',
          user: 'root',
          database: 'yayasan_db',
          ...dbConfig
      });
  }
}

pool = global.mysqlPool;

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT setting_key, setting_value FROM settings');
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    return settings;
  } catch (error) {
    console.error('Failed to get settings', error);
    return {};
  }
}

export default pool;
