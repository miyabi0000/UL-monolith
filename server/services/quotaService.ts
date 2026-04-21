import { db } from '../database/connection.js';

export type QuotaEndpoint = 'chat' | 'url';
export type Plan = 'free' | 'pro';

export const PLAN_QUOTAS: Record<Plan, Record<QuotaEndpoint, number>> = {
  free: { chat: 50, url: 100 },
  pro: { chat: 10000, url: 50000 },
};

interface UsageContext {
  userId: string;
  endpoint: QuotaEndpoint;
}

interface QuotaStatus {
  allowed: boolean;
  plan: Plan;
  used: number;
  limit: number;
}

function monthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function getUserPlan(userId: string): Promise<Plan> {
  // 決済が未設定の環境 (STG / 初期本番) では全員 Pro 扱い。
  // アップグレード手段が無いのに Free 制限をかけると AI が使えなくなるため。
  // Stripe キーを設定した時点で通常の users.plan ベースに切り替わる。
  if (!process.env.STRIPE_SECRET_KEY) {
    return 'pro';
  }
  const result = await db.query<{ plan: string }>(
    'SELECT plan FROM users WHERE id = $1',
    [userId],
  );
  const plan = result.rows[0]?.plan;
  return plan === 'pro' ? 'pro' : 'free';
}

export async function getMonthlyUsage(userId: string, endpoint: QuotaEndpoint): Promise<number> {
  const result = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM usage_events
      WHERE user_id = $1 AND endpoint = $2 AND created_at >= $3`,
    [userId, endpoint, monthStart()],
  );
  return parseInt(result.rows[0]?.count ?? '0', 10);
}

export async function checkQuota(userId: string, endpoint: QuotaEndpoint): Promise<QuotaStatus> {
  const [plan, used] = await Promise.all([
    getUserPlan(userId),
    getMonthlyUsage(userId, endpoint),
  ]);
  const limit = PLAN_QUOTAS[plan][endpoint];
  return { allowed: used < limit, plan, used, limit };
}

export async function recordUsage(
  { userId, endpoint }: UsageContext,
  tokens: { promptTokens?: number; completionTokens?: number } = {},
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO usage_events (user_id, endpoint, tokens_prompt, tokens_completion)
       VALUES ($1, $2, $3, $4)`,
      [userId, endpoint, tokens.promptTokens ?? 0, tokens.completionTokens ?? 0],
    );
  } catch (error) {
    // 記録失敗はリクエストを止めない（ログのみ）
    console.error('[quotaService] Failed to record usage:', error);
  }
}
