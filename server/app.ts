import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import routes
import gearRoutes from './routes/gear.js';
import categoryRoutes from './routes/categories.js';
import analyticsRoutes from './routes/analytics.js';
import llmRoutes from './routes/llm.js';
import authRoutes from './routes/auth.js';
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
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use('/api/', limiter); // 全APIにRate Limiting適用

// Stripe webhook は署名検証のため raw body が必要。express.json より先にマウントする。
app.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' })); // 画像データを含むリクエストのためにリミットを増やす
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'UL Gear Manager API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes（認証ミドルウェアをグローバルに適用）
app.use('/api/v1/gear', cognitoAuth, gearRoutes);
app.use('/api/v1/categories', cognitoAuth, categoryRoutes);
app.use('/api/v1/analytics', cognitoAuth, analyticsRoutes);
app.use('/api/v1/llm', cognitoAuth, strictLimiter, llmRoutes);
app.use('/api/v1/auth', authRoutes); // 認証エンドポイント自体は認証不要
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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
