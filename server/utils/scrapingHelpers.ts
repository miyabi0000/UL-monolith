/**
 * スクレイピング共通ヘルパー関数
 */

// JSON-LD抽出は headParsers に集約。後方互換のため re-export
export { extractJsonLd } from '../services/scraping/headParsers.js';

// Removed: CATEGORY_PATTERNS and guessCategory()
// Category matching is now handled by CategoryMatcher in server/services/categoryMatcher.ts

/**
 * 重量抽出パターン（日本語・英語対応）
 */
const WEIGHT_PATTERNS = [
  /重量[:\s\/]*(?:ポール[無込み・]*[\/\s])?(\d+(?:\.\d+)?)\s*(kg|g|グラム|キログラム)/i,
  /weight[:\s]*(\d+(?:\.\d+)?)\s*(kg|g|lbs|lb|pounds|oz|ounce)/i,
  /weighs\s+(\d+(?:\.\d+)?)\s*(kg|g|lbs|lb|pounds|oz|ounce)/i,  // "weighs 1lb"
  /(\d+(?:\.\d+)?)\s*(kg|g|グラム|キログラム)(?!\d)/i,
  /(\d+(?:\.\d+)?)\s*(lbs?|pounds?)(?!\d)/i,  // "1lb", "1 lb"
  /(\d+(?:\.\d+)?)\s*(oz|ounce)(?!\d)/i
];

/**
 * テキストから重量を抽出（グラム単位で返す）
 */
export function extractWeight(text: string): number | undefined {
  const lowerText = text.toLowerCase();
  
  for (const pattern of WEIGHT_PATTERNS) {
    const match = lowerText.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.includes('k')) {
        return Math.round(value * 1000); // kg -> g
      } else if (unit.includes('lb') || unit.includes('pound')) {
        return Math.round(value * 453.592); // lbs -> g
      } else if (unit.includes('oz') || unit.includes('ounce')) {
        return Math.round(value * 28.3495); // oz -> g
      } else {
        return Math.round(value); // g
      }
    }
  }
  
  return undefined;
}

/**
 * ブランド名をクリーニング（Amazon特有の接頭辞・接尾辞を除去）
 */
export function cleanBrandText(brand: string): string {
  return brand
    .replace(/^[:\s]+(ブランド|Brand|訪問:|Visit\s+the\s+|から|のストアを表示)/i, '')
    .replace(/^(ブランド|Brand|訪問:|Visit\s+the\s+|から|のストアを表示)[:\s]+/i, '')
    .replace(/\s*のストアを表示.*$/i, '')
    .replace(/\s*ストア.*$/i, '')
    .replace(/^[:\s]+/, '') // 先頭のコロンとスペースを削除
    .replace(/\(.*?\)$/, '') // 括弧内の日本語読みを削除
    .trim();
}

