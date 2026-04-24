import Stripe from 'stripe';
import { logger } from '../utils/logger.js';

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })
  : null;

export const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO ?? '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
export const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3001';

if (!stripe) {
  logger.warn('[Stripe] STRIPE_SECRET_KEY 未設定 - 決済エンドポイントは 503 を返します');
}
