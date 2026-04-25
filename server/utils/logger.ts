import pino, { Logger, LoggerOptions } from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * 構造化ロガー (pino)
 *
 * - 開発時: pino-pretty 相当の読みやすい出力 (stdout に color + timestamp)
 * - 本番 (NODE_ENV=production): 1 行 JSON (Railway / stack driver 等で parse 可能)
 *
 * `LOG_LEVEL` 環境変数で閾値を制御 (既定 info)。
 * 全 request に UUID (reqId) を自動付与し、`req.log.*` でコンテキスト付きログが書ける。
 */

const isProduction = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug');

const baseOptions: LoggerOptions = {
  level,
  base: {
    env: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
  },
  // 本番は JSON、開発時は pretty。pino-pretty は devDependency 化せず、
  // `pino.transport` 経由で読み込む (無ければ JSON に fallback)。
  transport: isProduction
    ? undefined
    : (() => {
        try {
          require.resolve('pino-pretty');
          return {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,env' },
          };
        } catch {
          return undefined;
        }
      })(),
  // 機密値がうっかりログに入らないよう redact しておく
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      '*.password',
      '*.apiKey',
    ],
    censor: '[REDACTED]',
  },
};

/** アプリ全体で使うルートロガー */
export const logger: Logger = pino(baseOptions);

/** Express に差し込む HTTP ロガー (request/response + reqId 自動付与) */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: IncomingMessage) => {
    const incoming = req.headers['x-request-id'];
    if (typeof incoming === 'string' && incoming.length > 0) return incoming;
    return randomUUID();
  },
  customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // ヘルスチェック等は info レベルだとノイズが多いので debug に下げる
  customSuccessMessage: (req: IncomingMessage, res: ServerResponse) =>
    `${req.method} ${req.url} → ${res.statusCode}`,
  customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) =>
    `${req.method} ${req.url} → ${res.statusCode} ${err.message}`,
  // 健康診断系は info を絞る
  serializers: {
    // pino-http が渡す req は IncomingMessage + 拡張プロパティ (id, userId)。
    // 全フィールドの完全な型は pino-http に依存するため最小限の shape で受ける。
    req: (req: IncomingMessage & { id?: string; userId?: string }) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      userId: req.userId,
    }),
    res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
  },
  // /api/health の成功ログは debug に落とす (alive 監視で溢れる対策)
  autoLogging: {
    ignore: (req: IncomingMessage) => req.url === '/api/health',
  },
});
