import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { resolveUserIdFromSub } from '../routes/shared/userProvisioning.js';

// Cognito JWT 検証ミドルウェア
// 開発時のみ COGNITO_USER_POOL_ID が未設定なら DEMO_USER_ID を使用。
// 本番 (NODE_ENV=production) で Cognito 未設定なら 401 を返す。

const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440100';
const isProduction = process.env.NODE_ENV === 'production';

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

if (!verifier) {
  if (isProduction) {
    console.error('[cognitoAuth] COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID が未設定です。本番では認証が必須のため、全てのリクエストに 401 を返します。');
  } else {
    console.warn('[cognitoAuth] Cognito 未設定 (開発モード) - DEMO_USER_ID をフォールバック使用');
  }
}

/**
 * 認証ミドルウェア
 * - Cognito 設定済み: JWT を検証し req.userId に sub を設定
 * - Cognito 未設定 (開発のみ): DEMO_USER_ID をフォールバック
 * - Cognito 未設定 (本番): 401 Unauthorized
 */
export async function cognitoAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Cognito 未設定 → 本番は401、開発は DEMO_USER_ID フォールバック
  if (!verifier) {
    if (isProduction) {
      res.status(401).json({
        success: false,
        message: 'Authentication is not configured on this server',
      });
      return;
    }
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
    if (!isProduction) {
      req.userId = DEMO_USER_ID;
    }
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
