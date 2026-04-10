import { Request } from 'express';

// 認証実装までの仮ユーザーID
export const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440100';

/**
 * リクエストからユーザーIDを取得
 * 優先順位:
 * 1. cognitoAuth ミドルウェアが設定した req.userId（JWT の sub）
 * 2. x-user-id ヘッダー（開発用フォールバック）
 * 3. DEMO_USER_ID（デフォルト）
 */
export function getRequestUserId(req: Request): string {
  // cognitoAuth ミドルウェアが設定した userId を優先
  if (req.userId) {
    return req.userId;
  }

  const headerUserId = req.headers['x-user-id'];
  if (typeof headerUserId === 'string' && headerUserId.length > 0) {
    return headerUserId;
  }
  return DEMO_USER_ID;
}
