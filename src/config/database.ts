import sql from 'mssql';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

const config: sql.config = {
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  server: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: env.NODE_ENV !== 'production',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

/**
 * Devuelve (o crea) el pool de conexiones a SQL Server.
 * El acceso a datos se realiza exclusivamente mediante Stored Procedures,
 * invocadas con parámetros tipados para prevenir SQL injection.
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    logger.info('Conectando a SQL Server...');
    pool = await new sql.ConnectionPool(config).connect();
    logger.info('Conexión a SQL Server establecida.');
  }
  return pool;
}
