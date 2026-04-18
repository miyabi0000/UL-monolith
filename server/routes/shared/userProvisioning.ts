import { db } from '../../database/connection.js';

/**
 * Cognito sub → users.id のマッピングとプロビジョニング
 *
 * JWT 検証後に呼び出し、users テーブルに行が無ければ自動作成（upsert）。
 * プロセス内キャッシュ（TTL 10分）で毎リクエストの DB アクセスを回避。
 */

// --- LRU + TTL キャッシュ ---

interface CacheEntry {
  userId: string;
  cachedAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10分
const CACHE_MAX_SIZE = 1000;

const cache = new Map<string, CacheEntry>();

/** キャッシュサイズが上限を超えたら古いエントリを削除 */
const evictIfNeeded = () => {
  if (cache.size <= CACHE_MAX_SIZE) return;
  // Map は挿入順なので先頭が最古
  const firstKey = cache.keys().next().value;
  if (firstKey !== undefined) {
    cache.delete(firstKey);
  }
};

/**
 * Cognito sub から users.id を解決する。
 * キャッシュにヒットすれば即座に返却。
 * ミス時は upsert で users 行を作成/更新し、id を返す。
 *
 * @param sub - JWT の sub クレーム (Cognito ユーザー ID)
 * @param email - JWT の email クレーム
 * @param name - JWT の name クレーム (オプショナル)
 * @returns users.id (UUID)
 */
export async function resolveUserIdFromSub(
  sub: string,
  email: string,
  name?: string,
): Promise<string> {
  // キャッシュヒット判定
  const cached = cache.get(sub);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.userId;
  }

  // Upsert: cognito_sub が一致する行があれば email を更新、無ければ INSERT
  // password_hash は NOT NULL 制約があるため固定文字列を入れる（Cognito が実パスワードを管理）
  const result = await db.query(
    `INSERT INTO users (cognito_sub, email, password_hash, name)
     VALUES ($1, $2, 'cognito_managed', $3)
     ON CONFLICT (cognito_sub) DO UPDATE SET email = EXCLUDED.email
     RETURNING id`,
    [sub, email, name || null],
  );

  const userId: string = result.rows[0].id;

  // キャッシュに格納
  cache.set(sub, { userId, cachedAt: Date.now() });
  evictIfNeeded();

  return userId;
}
