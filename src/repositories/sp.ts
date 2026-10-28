import type { ISqlType } from 'mssql';
import { getPool } from '../config/database.js';
import { env } from '../config/env.js';

export type SpParameter = {
  name: string;
  value: unknown;
  type?: (() => ISqlType) | ISqlType;
};

async function buildRequest(procedureName: string, params: SpParameter[]) {
  const pool = await getPool();
  const request = pool.request();

  for (const p of params) {
    if (p.type) {
      request.input(p.name, p.type, p.value);
    } else {
      request.input(p.name, p.value);
    }
  }

  const qualifiedName = `[${env.DB_SCHEMA}].${procedureName}`;
  return { request, qualifiedName };
}

/**
 * Ejecuta un Stored Procedure con parámetros tipados.
 *
 * Todo acceso a datos del proyecto pasa por aquí: se invocan SPs con
 * `request.input(name, type, value)`, sin concatenar cadenas SQL, lo que
 * previene SQL injection (requisito técnico obligatorio).
 *
 * El nombre del SP se califica automáticamente con el esquema configurado
 * (DB_SCHEMA) para que las llamadas no dependan del default schema del login.
 */
export async function executeProcedure<T = unknown>(
  procedureName: string,
  params: SpParameter[] = [],
): Promise<T> {
  const { request, qualifiedName } = await buildRequest(procedureName, params);
  const result = await request.execute(qualifiedName);
  return result.recordset as T;
}

/**
 * Ejecuta un SP que devuelve MÚLTIPLES result sets (p. ej. SP_Pedidos_Consultar).
 * Devuelve todos los recordsets como un array de arrays.
 */
export async function executeProcedureSets(
  procedureName: string,
  params: SpParameter[] = [],
): Promise<unknown[][]> {
  const { request, qualifiedName } = await buildRequest(procedureName, params);
  const result = await request.execute(qualifiedName);
  return (result.recordsets ?? []) as unknown[][];
}
