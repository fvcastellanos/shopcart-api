import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sql from 'mssql';
import { getPool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

/**
 * Runner de migraciones de ShopCart (estilo Flyway), limitado a UN esquema.
 *
 * Comandos:
 *   migrate   Aplica las migraciones pendientes en orden, dentro de una transacción.
 *   clean     Elimina únicamente los objetos del esquema configurado (DB_SCHEMA).
 *   status    Muestra qué migraciones ya se aplicaron y cuáles están pendientes.
 *
 * Los scripts viven en db/migrations/ con el formato V<numero>__<descripcion>.sql.
 * Dentro de ellos, el token `$(SCHEMA)` se sustituye por el esquema configurado.
 * La tabla <esquema>.Migraciones registra versión, checksum y fecha de aplicación.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Esquema donde viven todos los objetos de ShopCart (configurable vía DB_SCHEMA).
const SCHEMA_NAME = env.DB_SCHEMA;
const SCHEMA = quoteIdentifier(SCHEMA_NAME);
const TRACKING_TABLE = `${SCHEMA}.Migraciones`;
const SCHEMA_TOKEN = '$(SCHEMA)';

interface MigrationFile {
  version: string;
  description: string;
  file: string;
  checksum: string;
  sql: string;
}

interface AppliedMigration {
  version: string;
  checksum: string;
}

function quoteIdentifier(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Identificador SQL inválido: ${name}`);
  }
  return `[${name}]`;
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function numericVersion(version: string): number {
  const match = /^V(\d+)$/i.exec(version);
  if (!match) throw new Error(`Versión inválida: ${version}`);
  return Number(match[1]);
}

function parseFilename(filename: string): { version: string; description: string } | null {
  const match = /^V(\d+)__(.+)\.sql$/i.exec(filename);
  if (!match) return null;
  return {
    version: `V${match[1].padStart(3, '0')}`,
    description: match[2].replace(/_/g, ' '),
  };
}

/** Sustituye el token `$(SCHEMA)` por el esquema configurado (ya validado). */
function applySchema(sqlContent: string): string {
  return sqlContent.split(SCHEMA_TOKEN).join(SCHEMA);
}

async function loadMigrations(): Promise<MigrationFile[]> {
  const entries = await readdir(MIGRATIONS_DIR);
  const files = entries.filter((f) => f.toLowerCase().endsWith('.sql'));
  const migrations: MigrationFile[] = [];

  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed) {
      throw new Error(
        `Nombre de archivo de migración inválido: ${file}. Formato esperado: V<numero>__<descripcion>.sql`,
      );
    }
    const content = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    migrations.push({
      version: parsed.version,
      description: parsed.description,
      file,
      checksum: sha256(content),
      sql: content,
    });
  }

  migrations.sort((a, b) => numericVersion(a.version) - numericVersion(b.version));
  return migrations;
}

/**
 * Divide un script en lotes por el separador `GO` (necesario para CREATE/ALTER
 * PROCEDURE, VIEW, FUNCTION, TRIGGER, que deben ir en su propio lote).
 */
function splitBatches(sqlContent: string): string[] {
  return sqlContent
    .split(/^\s*GO\s*$/gim)
    .map((batch) => batch.trim())
    .filter((batch) => batch.length > 0);
}

async function ensureSchema(pool: sql.ConnectionPool): Promise<void> {
  const result = await pool
    .request()
    .input('schema', sql.NVarChar, SCHEMA_NAME)
    .query('SELECT 1 FROM sys.schemas WHERE name = @schema');

  if (result.recordset.length === 0) {
    await pool.request().query(`CREATE SCHEMA ${SCHEMA}`);
    console.log(`✔  Esquema creado: ${SCHEMA_NAME}`);
  }
}

async function ensureTrackingTable(pool: sql.ConnectionPool): Promise<void> {
  await pool.request().query(`
    IF OBJECT_ID('${TRACKING_TABLE}', 'U') IS NULL
    BEGIN
        CREATE TABLE ${TRACKING_TABLE} (
            ID          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Migraciones PRIMARY KEY,
            Version     NVARCHAR(50)  NOT NULL CONSTRAINT UQ_Migraciones_Version UNIQUE,
            Descripcion NVARCHAR(255) NOT NULL,
            Checksum    NVARCHAR(64)  NOT NULL,
            EjecutadaEn DATETIME2     NOT NULL CONSTRAINT DF_Migraciones_EjecutadaEn DEFAULT SYSUTCDATETIME()
        );
    END
  `);
}

async function getApplied(pool: sql.ConnectionPool): Promise<AppliedMigration[]> {
  const result = await pool
    .request()
    .query(`SELECT Version, Checksum FROM ${TRACKING_TABLE} ORDER BY ID`);
  return result.recordset.map((row) => ({
    version: String(row.Version),
    checksum: String(row.Checksum),
  }));
}

async function migrate(pool: sql.ConnectionPool): Promise<void> {
  await ensureSchema(pool);
  await ensureTrackingTable(pool);
  const migrations = await loadMigrations();
  const applied = await getApplied(pool);
  const appliedByVersion = new Map(applied.map((a) => [a.version, a]));

  // Detectar migraciones ya aplicadas cuyo contenido cambió.
  for (const m of migrations) {
    const appliedMigration = appliedByVersion.get(m.version);
    if (appliedMigration && appliedMigration.checksum !== m.checksum) {
      throw new Error(
        `La migración ${m.version} (${m.file}) fue modificada después de aplicarse. ` +
          'Crea una nueva migración en su lugar.',
      );
    }
  }

  const pending = migrations.filter((m) => !appliedByVersion.has(m.version));
  if (pending.length === 0) {
    console.log('✔  No hay migraciones pendientes.');
    return;
  }

  for (const m of pending) {
    const batches = splitBatches(applySchema(m.sql));
    const tx = new sql.Transaction(pool);
    try {
      await tx.begin();
      for (const batch of batches) {
        await new sql.Request(tx).batch(batch);
      }
      await new sql.Request(tx)
        .input('version', sql.NVarChar(50), m.version)
        .input('descripcion', sql.NVarChar(255), m.description)
        .input('checksum', sql.NVarChar(64), m.checksum)
        .query(
          `INSERT INTO ${TRACKING_TABLE} (Version, Descripcion, Checksum) ` +
            'VALUES (@version, @descripcion, @checksum)',
        );
      await tx.commit();
      console.log(`✔  Aplicada: ${m.version} — ${m.description} (${m.file})`);
    } catch (err) {
      await tx.rollback().catch(() => undefined);
      console.error(`✗  Falló: ${m.file}`);
      throw err;
    }
  }

  console.log('Migración completada.');
}

// Elimina SOLO los objetos del esquema configurado (@schema). Usa el catálogo
// del sistema (no datos de usuario), por lo que no hay riesgo de SQL injection.
const CLEAN_SQL = `
DECLARE @sql NVARCHAR(MAX) = N'';

-- 1) Llaves foráneas del esquema
SELECT @sql = @sql + N'ALTER TABLE ' + QUOTENAME(@schema) + N'.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + N' DROP CONSTRAINT ' + QUOTENAME(name) + N';' + NCHAR(13)
FROM sys.foreign_keys
WHERE OBJECT_SCHEMA_NAME(parent_object_id) = @schema;
EXEC sp_executesql @sql;

-- 2) Tablas (arrastran sus constraints y triggers)
SET @sql = N'';
SELECT @sql = @sql + N'DROP TABLE ' + QUOTENAME(@schema) + N'.' + QUOTENAME(name) + N';' + NCHAR(13)
FROM sys.tables
WHERE SCHEMA_NAME(schema_id) = @schema;
EXEC sp_executesql @sql;

-- 3) Vistas
SET @sql = N'';
SELECT @sql = @sql + N'DROP VIEW ' + QUOTENAME(@schema) + N'.' + QUOTENAME(name) + N';' + NCHAR(13)
FROM sys.views
WHERE SCHEMA_NAME(schema_id) = @schema;
EXEC sp_executesql @sql;

-- 4) Procedimientos
SET @sql = N'';
SELECT @sql = @sql + N'DROP PROCEDURE ' + QUOTENAME(@schema) + N'.' + QUOTENAME(name) + N';' + NCHAR(13)
FROM sys.procedures
WHERE SCHEMA_NAME(schema_id) = @schema;
EXEC sp_executesql @sql;

-- 5) Funciones
SET @sql = N'';
SELECT @sql = @sql + N'DROP FUNCTION ' + QUOTENAME(@schema) + N'.' + QUOTENAME(name) + N';' + NCHAR(13)
FROM sys.objects
WHERE type IN ('FN','IF','TF','FS','FT') AND is_ms_shipped = 0 AND SCHEMA_NAME(schema_id) = @schema;
EXEC sp_executesql @sql;

-- 6) Secuencias y sinónimos
SET @sql = N'';
SELECT @sql = @sql + N'DROP ' + CASE type WHEN 'SN' THEN N'SYNONYM' WHEN 'SO' THEN N'SEQUENCE' END + N' ' + QUOTENAME(@schema) + N'.' + QUOTENAME(name) + N';' + NCHAR(13)
FROM sys.objects
WHERE type IN ('SN','SO') AND is_ms_shipped = 0 AND SCHEMA_NAME(schema_id) = @schema;
EXEC sp_executesql @sql;

-- 7) Tipos de tabla definidos por el usuario
SET @sql = N'';
SELECT @sql = @sql + N'DROP TYPE ' + QUOTENAME(SCHEMA_NAME(schema_id)) + N'.' + QUOTENAME(name) + N';' + NCHAR(13)
FROM sys.table_types
WHERE SCHEMA_NAME(schema_id) = @schema;
EXEC sp_executesql @sql;
`;

async function clean(pool: sql.ConnectionPool): Promise<void> {
  await pool
    .request()
    .input('schema', sql.NVarChar, SCHEMA_NAME)
    .batch(CLEAN_SQL);
  console.log(`✔  Esquema limpio: se eliminaron los objetos del esquema ${SCHEMA_NAME}.`);
}

async function status(pool: sql.ConnectionPool): Promise<void> {
  await ensureSchema(pool);
  await ensureTrackingTable(pool);
  const migrations = await loadMigrations();
  const applied = await getApplied(pool);
  const appliedSet = new Set(applied.map((a) => a.version));

  if (migrations.length === 0) {
    console.log('No hay migraciones en db/migrations.');
    return;
  }

  for (const m of migrations) {
    const done = appliedSet.has(m.version);
    console.log(`${done ? '✔' : '·'}  ${m.version}  ${m.description}${done ? '' : '   (pendiente)'}`);
  }
}

function usage(): void {
  console.log('Uso: npm run db:<comando>  (o tsx db/migrate.ts <comando>)');
  console.log('  migrate   Aplica las migraciones pendientes');
  console.log(`  clean     Elimina los objetos del esquema ${SCHEMA_NAME}`);
  console.log('  status    Muestra el estado de las migraciones');
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'migrate';
  let pool: sql.ConnectionPool | null = null;
  let exitCode = 0;

  try {
    pool = await getPool();
    switch (command) {
      case 'migrate':
        await migrate(pool);
        break;
      case 'clean':
        await clean(pool);
        break;
      case 'status':
        await status(pool);
        break;
      default:
        usage();
        exitCode = 1;
    }
  } catch (err) {
    console.error('\n✗  Error:', err instanceof Error ? err.message : err);
    exitCode = 1;
  } finally {
    await pool?.close().catch(() => undefined);
  }

  process.exit(exitCode);
}

void main();
