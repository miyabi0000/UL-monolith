/**
 * マイグレーションランナー
 *
 * server/database/migrations/*.sql を辞書順に適用する。
 * 適用済みは schema_migrations テーブルで追跡。
 *
 * 実行: npm run migrate
 *
 * - Railway/Render 等の DATABASE_URL を優先
 * - 既存環境変数 (DB_HOST 等) はフォールバック (docker-compose 開発用)
 * - init.sql は流さない (docker-entrypoint で初回のみ実行される前提)
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      database: process.env.DB_NAME || 'gear_manager',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });

async function ensureSchemaMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedVersions(): Promise<Set<string>> {
  const result = await pool.query('SELECT version FROM schema_migrations');
  return new Set(result.rows.map((r) => r.version as string));
}

async function applyMigration(version: string, sql: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
    await client.query('COMMIT');
    console.log(`  ✅ ${version}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`  ❌ ${version} failed:`, err);
    throw err;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  console.log('🚀 Running database migrations...');

  // Railway 等の本番では init.sql の内容も流す必要がある (docker-entrypoint が動かないため)
  // 開発時 (docker-compose) では init.sql は postgres 起動時に自動で適用済み
  // 判定: schema_migrations テーブルが無い & users テーブルも無い → 初期セットアップ
  await ensureSchemaMigrationsTable();

  const usersCheck = await pool.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') AS exists`,
  );
  if (!usersCheck.rows[0].exists) {
    console.log('📦 Initial schema not found. Running init.sql...');
    const initPath = path.resolve(__dirname, '../database/init.sql');
    const initSql = fs.readFileSync(initPath, 'utf-8');
    await pool.query(initSql);
    console.log('  ✅ init.sql applied');
  }

  // migrations/*.sql を辞書順に適用
  const migrationsDir = path.resolve(__dirname, '../database/migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = await getAppliedVersions();
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log('✨ No pending migrations.');
    await pool.end();
    return;
  }

  console.log(`📋 ${pending.length} pending migration(s):`);
  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await applyMigration(file, sql);
  }

  console.log('✨ All migrations applied.');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
