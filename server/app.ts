import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { logger, httpLogger } from './utils/logger.js';

// Import routes
import gearRoutes from './routes/gear.js';
import categoryRoutes from './routes/categories.js';
import analyticsRoutes from './routes/analytics.js';
import llmRoutes from './routes/llm.js';
import imageProxyRoutes from './routes/imageProxy.js';
import packRoutes from './routes/packs.js';
import profileRoutes from './routes/profile.js';
import advisorRoutes from './routes/advisor.js';
import billingRoutes from './routes/billing.js';
import { cognitoAuth } from './middleware/cognitoAuth.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 8000;
const isDevelopment = (process.env.NODE_ENV || 'development') !== 'production';
const defaultApiMax = isDevelopment ? 2000 : 100;
const defaultLlmMax = isDevelopment ? 120 : 10;

// dist/ ディレクトリの解決
// 開発時 (tsx): __dirname = .../UL-monolith/server → ../dist
// 本番 (tsc コンパイル後): __dirname = .../UL-monolith/server/dist → ../../dist
// 注意: 本番では ../dist が server/dist (JS 出力) を指すので、
// index.html の存在でフロント dist かを判定する
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidates = [
  path.resolve(__dirname, '../dist'),       // tsx watch (server/app.ts から)
  path.resolve(__dirname, '../../dist'),    // production (server/dist/app.js から)
];
const distPath = candidates.find((p) => fs.existsSync(path.join(p, 'index.html'))) ?? null;

// Rate Limiting設定
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: Number(process.env.RATE_LIMIT_MAX || defaultApiMax), // 開発時は上限を緩和
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: Number(process.env.LLM_RATE_LIMIT_MAX || defaultLlmMax), // 開発時は上限を緩和
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests, please try again later.'
  }
});

// Middleware
// CSP は無効化: Cognito (cognito-idp.*.amazonaws.com) や外部の商品画像で
// default-src 'self' に引っかかって fetch がブロックされるため。
// 必要になったら connect-src / img-src を明示した上で再有効化する。
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(httpLogger); // pino-http: req/res ログ + reqId 自動付与 (req.log / req.id で取得可)
app.use('/api/', limiter); // 全APIにRate Limiting適用

// Stripe webhook は署名検証のため raw body が必要。express.json より先にマウントする。
app.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' })); // 画像データを含むリクエストのためにリミットを増やす
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// robots.txt - STG のみ検索エンジンインデックス禁止。本番は標準許可。
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  if (process.env.APP_ENV === 'staging') {
    res.send('User-agent: *\nDisallow: /\n');
  } else {
    res.send('User-agent: *\nAllow: /\n');
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'UL Gear Manager API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    appEnv: process.env.APP_ENV || 'development'
  });
});

// API routes（認証ミドルウェアをグローバルに適用）
app.use('/api/v1/gear', cognitoAuth, gearRoutes);
app.use('/api/v1/categories', cognitoAuth, categoryRoutes);
app.use('/api/v1/analytics', cognitoAuth, analyticsRoutes);
app.use('/api/v1/llm', cognitoAuth, strictLimiter, llmRoutes);
app.use('/api/v1/image', imageProxyRoutes); // 画像プロキシは認証不要
app.use('/api/v1/packs', packRoutes); // パック（内部で認証制御）
app.use('/api/v1/profile', profileRoutes); // プロフィール（内部で認証制御）
app.use('/api/v1/advisor', advisorRoutes); // アドバイザー（内部で認証制御）
app.use('/api/v1/billing', billingRoutes); // 決済（内部で認証制御。webhook は認証不要）

// 静的フロントエンド配信 (本番のみ: dist/ が存在する場合)
// dist が無い時は API のみ公開し、開発時はフロントを vite 側で動かす
if (distPath) {
  app.use(express.static(distPath));
  // SPA フォールバック: API 以外の全パスを index.html にフォールバック
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // dist 無し: ルートだけ JSON で案内
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'UL Gear Manager API',
      health: '/api/health',
    });
  });
}

// Error handling middleware
// pino-http が自動付与した req.id を使って相関。詳細はサーバー側ログに留める。
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestId = (req as express.Request & { id?: string }).id ?? 'unknown';
  const name = err instanceof Error ? err.name : 'UnknownError';
  const message = err instanceof Error ? err.message : String(err);

  req.log?.error({ err, name, requestId }, message);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    requestId,
  });
});

// 404 handler (API のみ。SPA フォールバック後に到達するのは /api/* の存在しないルート)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  logger.info({ port: PORT }, `Server running on http://localhost:${PORT}`);
});

export default app;
