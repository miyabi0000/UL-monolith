import { callAPIWithRetry, API_CONFIG } from './api.client';

/**
 * Stripe Checkout セッションを作成し、決済ページ URL を取得
 */
export async function createCheckoutSession(): Promise<string> {
  const response = await callAPIWithRetry('/billing/checkout', {}, API_CONFIG.timeout.standard);
  if (!response.success || !response.data?.url) {
    throw new Error(response.message || 'Failed to create checkout session');
  }
  return response.data.url;
}

/**
 * Stripe Customer Portal セッションを作成（サブスク管理・キャンセル用）
 */
export async function createPortalSession(): Promise<string> {
  const response = await callAPIWithRetry('/billing/portal', {}, API_CONFIG.timeout.standard);
  if (!response.success || !response.data?.url) {
    throw new Error(response.message || 'Failed to create portal session');
  }
  return response.data.url;
}
