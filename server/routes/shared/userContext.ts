import { Request } from 'express';

// 認証実装までの仮ユーザーID
export const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440100';

export function getRequestUserId(req: Request): string {
  const headerUserId = req.headers['x-user-id'];
  if (typeof headerUserId === 'string' && headerUserId.length > 0) {
    return headerUserId;
  }
  return DEMO_USER_ID;
}
