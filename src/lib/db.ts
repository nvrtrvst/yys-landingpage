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

let settingsCache: { value: Record<string, string>; ts: number } | null = null;
const SETTINGS_TTL_MS = 60_000;

export async function getSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (settingsCache && now - settingsCache.ts < SETTINGS_TTL_MS) return settingsCache.value;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT setting_key, setting_value FROM settings');
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    settingsCache = { value: settings, ts: now };
    return settings;
  } catch (error) {
    console.error('Failed to get settings', error);
    return settingsCache ? settingsCache.value : {};
  }
}

export function invalidateSettingsCache(): void {
  settingsCache = null;
}

export default pool;
