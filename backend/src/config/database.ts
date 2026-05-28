import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { config } from './env';

const pool: Pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export async function getConnection(): Promise<PoolConnection> {
  return pool.getConnection();
}

export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<T> {
  const [rows] = await pool.query<T>(sql, params);
  return rows;
}

export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

export default pool;
