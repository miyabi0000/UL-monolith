import { Request } from 'express';

/**
 * リクエストからユーザーIDを取得
 *
 * cognitoAuth ミドルウェアが先に走って必ず req.userId を設定する前提。
 * 認証無し / 検証失敗時は cognitoAuth が 401 を返してこの関数には到達しない。
 */
export function getRequestUserId(req: Request): string {
  if (!req.userId) {
    throw new Error('getRequestUserId called without cognitoAuth middleware');
  }
  return req.userId;
}
