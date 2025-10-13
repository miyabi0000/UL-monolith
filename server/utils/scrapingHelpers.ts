import * as cheerio from 'cheerio';

/**
 * スクレイピング共通ヘルパー関数
 */

/**
 * JSON-LD構造化データを抽出
 */
export function extractJsonLd($: cheerio.Root): any | null {
  try {
    const jsonLdScript = $('script[type="application/ld+json"]').html();
    if (jsonLdScript) {
      return JSON.parse(jsonLdScript);
    }
  } catch (e) {
    // パース失敗
  }
  return null;
}

/**
 * カテゴリ判定用パターン（優先度順）
 */
export const CATEGORY_PATTERNS = {
  'Backpack': /バッグ|リュック|backpack|bag|鞄|ザック/i,
  'Shelter': /ビビィ|bivy|bivvy|シェルター|テント|tent|shelter|tarp|タープ/i,
  'Clothing': /服|ウェア|ファッション|clothing|apparel|jacket|shirt|ジャケット|パンツ|pants/i,
  'Cooking': /キッチン|調理|クッキング|kitchen|cooking|stove|ストーブ|クッカー|cooker/i,
  'Safety': /安全|セーフティ|safety|first.?aid|emergency|救急|ライト|light/i
} as const;

/**
 * テキストからカテゴリを推測
 */
export function guessCategory(text: string): string {
  const lowerText = text.toLowerCase();
  
  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(lowerText)) {
      return category;
    }
  }
  
  return 'Other';
}

/**
 * 重量抽出パターン（日本語・英語対応）
 */
const WEIGHT_PATTERNS = [
  /重量[:\s\/]*(?:ポール[無込み・]*[\/\s])?(\d+(?:\.\d+)?)\s*(kg|g|グラム|キログラム)/i,
  /weight[:\s]*(\d+(?:\.\d+)?)\s*(kg|g|lbs|pounds|oz|ounce)/i,
  /(\d+(?:\.\d+)?)\s*(kg|g|グラム|キログラム)(?!\d)/i
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

