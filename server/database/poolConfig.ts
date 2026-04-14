import type { PoolConfig } from 'pg';

/**
 * pg Pool の接続設定を構築する。
 *
 * - 本番ホスティング (Railway / Render 等): DATABASE_URL を優先。SSL デフォルト on
 *   (`DATABASE_SSL=false` で明示的に無効化可能)
 * - 開発 (docker-compose): DB_HOST 等の個別変数フォールバック
 */
export function buildPoolConfig(): PoolConfig {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME || 'gear_manager',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  };
}
