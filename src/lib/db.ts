import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2/promise';
import { logError } from '@/lib/errors';

const DB_CONNECTION_LIMIT = parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10);
const DB_MAX_IDLE = parseInt(process.env.DB_MAX_IDLE || '10', 10);
const DB_IDLE_TIMEOUT = parseInt(process.env.DB_IDLE_TIMEOUT || '60000', 10);
const SETTINGS_CACHE_TTL = parseInt(process.env.SETTINGS_CACHE_TTL || '60000', 10);

const dbConfig = {
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: DB_CONNECTION_LIMIT,
  maxIdle: DB_MAX_IDLE,
  idleTimeout: DB_IDLE_TIMEOUT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Global is used here to maintain a cached connection across hot reloads
// in development. This prevents connections multiplying exponentially.
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

const pool = global.mysqlPool!;

let settingsCache: { value: Record<string, string>; ts: number } | null = null;

export async function getSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (settingsCache && now - settingsCache.ts < SETTINGS_CACHE_TTL) return settingsCache.value;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT setting_key, setting_value FROM settings');
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    settingsCache = { value: settings, ts: now };
    return settings;
  } catch (error) {
    logError(error, 'Settings fetch');
    return settingsCache ? settingsCache.value : {};
  }
}

export function invalidateSettingsCache(): void {
  settingsCache = null;
}

export default pool;
