import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { resolveUserIdFromSub } from '../routes/shared/userProvisioning';

// Cognito JWT 検証ミドルウェア
// 開発時は COGNITO_USER_POOL_ID が未設定なら認証をスキップ（DEMO_USER_ID を使用）

const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440100';

// 型拡張: req に userId を追加
declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

// Cognito が設定されている場合のみ Verifier を生成
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

const verifier = userPoolId && clientId
  ? CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    })
  : null;

/**
 * 認証ミドルウェア
 * - Cognito 設定済み: JWT を検証し req.userId に sub を設定
 * - Cognito 未設定（開発時）: DEMO_USER_ID をフォールバック
 */
export async function cognitoAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Cognito 未設定 → 開発モード（DEMO_USER_ID）
  if (!verifier) {
    req.userId = DEMO_USER_ID;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authorization header required',
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifier.verify(token);
    const email = (payload as Record<string, unknown>)['email'] as string | undefined;
    if (!email) {
      res.status(401).json({ success: false, message: 'ID token missing email claim' });
      return;
    }
    const name = (payload as Record<string, unknown>)['name'] as string | undefined;
    // Cognito sub → users.id にマッピング（初回は自動プロビジョニング）
    req.userId = await resolveUserIdFromSub(payload.sub, email, name);
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

/**
 * オプショナル認証（公開エンドポイント用）
 * トークンがあれば検証してユーザーIDを設定、なくてもリクエストを通す
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!verifier) {
    req.userId = DEMO_USER_ID;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // トークンなし → 未認証で続行
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifier.verify(token);
    const email = (payload as Record<string, unknown>)['email'] as string | undefined;
    if (email) {
      const name = (payload as Record<string, unknown>)['name'] as string | undefined;
      req.userId = await resolveUserIdFromSub(payload.sub, email, name);
    }
  } catch {
    // トークン無効でも続行（公開ページ用）
  }
  next();
}
