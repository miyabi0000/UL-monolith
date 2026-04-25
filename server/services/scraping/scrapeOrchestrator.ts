import { LLMExtractionResult } from '../../models/types.js';
import { amazonScraper } from '../amazonScraper.js';
import { webScrapingService } from '../webScrapingService.js';
import { normalizeUrl } from './normalizeUrl.js';
import { db } from '../../database/connection.js';
import { extractSnippets } from './snippet.js';
import { llmFallback } from '../llm/llmFallback.js';
import { validateAndSanitize } from './validateResult.js';
import { logger } from '../../utils/logger.js';

/**
 * スクレイピング入口オーケストレータ
 * Amazon / 汎用の振り分け、キャッシュ、LLMフォールバック、失敗理由コードの付与
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
const CACHE_TTL_SECONDS = parseInt(process.env.SCRAPE_CACHE_TTL || '86400');
const LLM_FALLBACK_ENABLED = process.env.LLM_FALLBACK === '1';

// ==================== メイン ====================

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
        logger.info(`[Orchestrator] Cache HIT: ${normalized}`);
        return { data: cached as unknown as LLMExtractionResult, failureReasons: [] };
      }
    } catch (error) {
      logger.warn({ err: error }, '[Orchestrator] Cache read failed:');
    }
  }

  // ── スクレイピング実行 ──
  try {
    const isAmazon = url.includes('amazon.');
    const scrapeResult = isAmazon
      ? await amazonScraper.scrapeAmazonProduct(url)
      : await webScrapingService.scrapeGeneric(url);

    let data = scrapeResult.data;

    // ── LLMフォールバック（欠損時のみ、HTMLを再利用） ──
    if (LLM_FALLBACK_ENABLED && needsLlmFallback(data) && scrapeResult.html) {
      logger.info(`[Orchestrator] LLM fallback triggered for ${url}`);
      data = await tryLlmFallback(url, data, scrapeResult.html);
    }

    // ── 値域検証・サニタイズ ──
    // 異常値 (負の重量、カテゴリ名が brand に混入 等) をここで除去。
    // 必ず LLM 後、キャッシュ前に実行して不正データが永続化されないようにする。
    data = validateAndSanitize(data);

    const failureReasons = detectFailureReasons(data);

    // ── キャッシュ書き込み（LLM補完後の結果を保存） ──
    if (CACHE_ENABLED && data.source !== 'fallback') {
      db.setScrapeCache(normalized, data as unknown as Record<string, unknown>, CACHE_TTL_SECONDS)
        .catch(err => logger.warn({ err: err }, '[Orchestrator] Cache write failed:'));
    }

    return { data, failureReasons };
  } catch (error) {
    logger.error({ err: error }, `[Orchestrator] Scraping failed for ${url}:`);
    const reason: ScrapeFailureReason =
      error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'fetch_error';
    return { data: createFallback(url, String(error)), failureReasons: [reason] };
  }
}

// ==================== LLMゲート ====================

/** 欠損がありLLM補完が必要か判定 */
function needsLlmFallback(data: LLMExtractionResult): boolean {
  if (data.source === 'fallback') return false; // 完全失敗時はスニペットも取れないので呼ばない
  const nameMissing = !data.name || data.name === 'Unknown Product' || data.name === 'Amazon Product';
  const weightMissing = !data.weightGrams;
  const categoryUnknown = !data.suggestedCategory || data.suggestedCategory === 'Other';
  return nameMissing || weightMissing || categoryUnknown;
}

/** LLMフォールバックを試行し、成功時はデータをマージして返す */
async function tryLlmFallback(url: string, data: LLMExtractionResult, html: string): Promise<LLMExtractionResult> {
  try {
    const snippets = extractSnippets(html);
    const patch = await llmFallback(url, data, snippets);
    if (!patch) return data;

    logger.info(`[Orchestrator] LLM filled fields: ${Object.keys(patch).join(', ')}`);

    const merged = { ...data, ...patch, source: 'web_scraping' };
    // extractedFields にLLM補完分を追加
    const newFields = new Set(data.extractedFields);
    if (patch.name) newFields.add('name');
    if (patch.brand) newFields.add('brand');
    if (patch.weightGrams) newFields.add('weightGrams');
    if (patch.priceCents) newFields.add('priceCents');
    if (patch.suggestedCategory) newFields.add('suggestedCategory');
    merged.extractedFields = [...newFields];

    return merged;
  } catch (error) {
    logger.warn({ err: error }, '[Orchestrator] LLM fallback failed, using scrape-only result:');
    return data;
  }
}

// ==================== ヘルパー ====================

function detectFailureReasons(data: LLMExtractionResult): ScrapeFailureReason[] {
  const reasons: ScrapeFailureReason[] = [];
  if (!data.name || data.name === 'Unknown Product' || data.name === 'Amazon Product') {
    reasons.push('selector_miss');
  }
  if (data.source === 'fallback') reasons.push('fetch_error');
  return reasons;
}

function createFallback(url: string, reason: string): LLMExtractionResult {
  let fallbackName = 'Product from URL';
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    fallbackName = `Product from ${domain}`;
  } catch { /* ignore */ }

  logger.info(`[Orchestrator] Creating fallback for ${url}: ${reason}`);
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
