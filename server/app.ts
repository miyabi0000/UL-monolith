import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

// Import routes
import gearRoutes from './routes/gear';
import categoryRoutes from './routes/categories';
import analyticsRoutes from './routes/analytics';
import llmRoutes from './routes/llm';
import authRoutes from './routes/auth';
import imageProxyRoutes from './routes/imageProxy';
import packRoutes from './routes/packs';
import { cognitoAuth } from './middleware/cognitoAuth';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 8000;
const isDevelopment = (process.env.NODE_ENV || 'development') !== 'production';
const defaultApiMax = isDevelopment ? 2000 : 100;
const defaultLlmMax = isDevelopment ? 120 : 10;

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

// Root endpoint to avoid 404 on base URL
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'UL Gear Manager API',
    health: '/api/health',
    docs: '/docs/startup-guide.md'
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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
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
