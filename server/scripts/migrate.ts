/**
 * マイグレーションランナー
 *
 * users テーブルが存在しなければ init.sql を流し、
 * server/database/migrations/*.sql を schema_migrations で追跡しつつ順次適用する。
 *
 * 本番 (Railway 等) はデプロイ毎に起動コマンドの先頭で実行、
 * 開発 (docker-compose) は postgres が init.sql を自動実行するため
 * migrate は未適用の migrations のみ流す。
 *
 * 実行: npm run migrate
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { buildPoolConfig } from '../database/poolConfig.js';
import { logger } from '../utils/logger.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// database ディレクトリの解決: tsx 実行時は ../database、tsc コンパイル後は ../../database
// 本番 (コンパイル後) の ../database は dist/database/ になり JS のみで init.sql が無いので、
// init.sql の存在でディレクトリを判定する
function resolveDatabaseDir(): string {
  const candidates = [
    path.resolve(__dirname, '../database'),
    path.resolve(__dirname, '../../database'),
  ];
  const found = candidates.find((p) => fs.existsSync(path.join(p, 'init.sql')));
  if (!found) {
    throw new Error(`database directory not found. Checked: ${candidates.join(', ')}`);
  }
  return found;
}
const databaseDir = resolveDatabaseDir();

// スクリプト終了時に pool.end() を呼ぶため、app の db singleton とは別インスタンス
const pool = new Pool(buildPoolConfig());

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
    logger.info(`  ✅ ${version}`);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err: err }, `  ❌ ${version} failed:`);
    throw err;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  logger.info('🚀 Running database migrations...');

  // Railway 等の本番では init.sql の内容も流す必要がある (docker-entrypoint が動かないため)
  // 開発時 (docker-compose) では init.sql は postgres 起動時に自動で適用済み
  // 判定: schema_migrations テーブルが無い & users テーブルも無い → 初期セットアップ
  await ensureSchemaMigrationsTable();

  const usersCheck = await pool.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') AS exists`,
  );
  if (!usersCheck.rows[0].exists) {
    logger.info('📦 Initial schema not found. Running init.sql...');
    const initSql = fs.readFileSync(path.join(databaseDir, 'init.sql'), 'utf-8');
    await pool.query(initSql);
    logger.info('  ✅ init.sql applied');
  }

  // migrations/*.sql を辞書順に適用
  const migrationsDir = path.join(databaseDir, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = await getAppliedVersions();
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    logger.info('✨ No pending migrations.');
    await pool.end();
    return;
  }

  logger.info(`📋 ${pending.length} pending migration(s):`);
  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await applyMigration(file, sql);
  }

  logger.info('✨ All migrations applied.');
  await pool.end();
}

main().catch((err) => {
  logger.error({ err: err }, 'Migration failed:');
  process.exit(1);
});
