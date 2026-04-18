import { Request, Response, NextFunction } from 'express';
import { checkQuota, QuotaEndpoint } from '../services/quotaService.js';

/**
 * 月次クォータ判定ミドルウェア。
 * cognitoAuth の後に挟む前提（req.userId が必須）。
 * 超過時は 429 + quota_exceeded を返す。
 */
export function quotaCheck(endpoint: QuotaEndpoint) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    try {
      const status = await checkQuota(req.userId, endpoint);
      res.setHeader('X-Quota-Plan', status.plan);
      res.setHeader('X-Quota-Limit', String(status.limit));
      res.setHeader('X-Quota-Used', String(status.used));

      if (!status.allowed) {
        res.status(429).json({
          success: false,
          error: 'quota_exceeded',
          message:
            status.plan === 'free'
              ? '今月の無料枠を使い切りました。Pro にアップグレードすると利用を継続できます。'
              : 'Pro プランのフェアユース上限に達しました。しばらくしてから再試行してください。',
          plan: status.plan,
          used: status.used,
          limit: status.limit,
          endpoint,
        });
        return;
      }
      next();
    } catch (error) {
      console.error('[quotaCheck] Failed:', error);
      // DB 障害でもユーザー体験を止めない（記録はできないが通す）
      next();
    }
  };
}
