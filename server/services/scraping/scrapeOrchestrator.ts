import { LLMExtractionResult } from '../../models/types.js';
import { amazonScraper } from '../amazonScraper.js';
import { webScrapingService } from '../webScrapingService.js';
import { normalizeUrl } from './normalizeUrl.js';
import { db } from '../../database/connection.js';

/**
 * スクレイピング入口オーケストレータ
 * Amazon / 汎用の振り分け、キャッシュ、失敗理由コードの付与を行う
 */

// ==================== 型定義 ====================

export type ScrapeFailureReason =
  | 'invalid_url'
  | 'fetch_error'
  | 'timeout'
  | 'blocked'
  | 'jsonld_parse_error'
  | 'ogp_missing'
  | 'selector_miss';

export interface ScrapeResult {
  data: LLMExtractionResult;
  failureReasons: ScrapeFailureReason[];
}

// ==================== 設定 ====================

const CACHE_ENABLED = process.env.SCRAPE_CACHE === '1';
const CACHE_TTL_SECONDS = parseInt(process.env.SCRAPE_CACHE_TTL || '86400'); // デフォルト24時間

// ==================== メイン ====================

/**
 * URLをスクレイピングしてギア情報を返す
 * SCRAPE_CACHE=1 の場合、キャッシュを read-through で利用
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  // URL検証
  try {
    new URL(url);
  } catch {
    return {
      data: createFallback(url, 'Invalid URL format'),
      failureReasons: ['invalid_url'],
    };
  }

  const normalized = normalizeUrl(url);

  // ── キャッシュ読み取り ──
  if (CACHE_ENABLED) {
    try {
      const cached = await db.getScrapeCache(normalized);
      if (cached) {
        console.log(`[Orchestrator] Cache HIT: ${normalized}`);
        return {
          data: cached as unknown as LLMExtractionResult,
          failureReasons: [],
        };
      }
      console.log(`[Orchestrator] Cache MISS: ${normalized}`);
    } catch (error) {
      console.warn('[Orchestrator] Cache read failed, proceeding without cache:', error);
    }
  }

  // ── スクレイピング実行 ──
  try {
    const isAmazon = url.includes('amazon.');
    const data = isAmazon
      ? await amazonScraper.scrapeAmazonProduct(url)
      : await webScrapingService.scrapeGeneric(url);

    const failureReasons = detectFailureReasons(data);

    // ── キャッシュ書き込み（成功時のみ） ──
    if (CACHE_ENABLED && data.source !== 'fallback') {
      db.setScrapeCache(normalized, data as unknown as Record<string, unknown>, CACHE_TTL_SECONDS)
        .catch(err => console.warn('[Orchestrator] Cache write failed:', err));
    }

    return { data, failureReasons };
  } catch (error) {
    console.error(`[Orchestrator] Scraping failed for ${url}:`, error);

    const reason: ScrapeFailureReason =
      error instanceof Error && error.message.includes('timeout')
        ? 'timeout'
        : 'fetch_error';

    return {
      data: createFallback(url, error instanceof Error ? error.message : 'Unknown error'),
      failureReasons: [reason],
    };
  }
}

// ==================== ヘルパー ====================

/**
 * 抽出結果から失敗理由コードを検出
 */
function detectFailureReasons(data: LLMExtractionResult): ScrapeFailureReason[] {
  const reasons: ScrapeFailureReason[] = [];

  if (!data.name || data.name === 'Unknown Product' || data.name === 'Amazon Product') {
    reasons.push('selector_miss');
  }
  if (data.source === 'fallback') {
    reasons.push('fetch_error');
  }

  return reasons;
}

/**
 * フォールバック結果生成
 */
function createFallback(url: string, reason: string): LLMExtractionResult {
  let fallbackName = 'Product from URL';
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    fallbackName = `Product from ${domain}`;
  } catch {
    // URL解析失敗時はデフォルト名を使用
  }

  console.log(`[Orchestrator] Creating fallback for ${url}: ${reason}`);

  return {
    name: fallbackName,
    productUrl: url,
    suggestedCategory: 'Other',
    requiredQuantity: 1,
    ownedQuantity: 0,
    priority: 3,
    extractedFields: [],
    source: 'fallback',
    confidence: 0.2,
  };
}
