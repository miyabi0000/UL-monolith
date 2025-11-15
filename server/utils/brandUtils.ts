/**
 * ブランド処理ユーティリティ - 統合版
 */

const KNOWN_BRANDS = [
  "Arc'teryx", 'Patagonia', 'The North Face', 'Montbell',
  'Coleman', 'Snow Peak', 'MSR', 'Black Diamond',
  'Osprey', 'Gregory', 'Deuter', 'Mammut'
];

const BRAND_ALIASES: { [key: string]: string } = {
  'tnf': 'The North Face',
  'the north face': 'The North Face',
  'patagonia': 'Patagonia',
  'arcteryx': "Arc'teryx",
  'montbell': 'Montbell',
  'coleman': 'Coleman',
  'snow peak': 'Snow Peak',
  'snowpeak': 'Snow Peak'
};

/**
 * ブランド名の正規化（統一処理）
 */
export function normalizeBrand(brand: string): string {
  if (!brand) return '';
  
  const cleaned = brand
    .replace(/^(ブランド|Brand|訪問:|Visit\s+the\s+|から|のストアを表示)/i, '')
    .replace(/\s*のストアを表示.*$/i, '')
    .replace(/\s*ストア.*$/i, '')
    .trim();
  
  const normalized = cleaned.toLowerCase();
  return BRAND_ALIASES[normalized] || cleaned;
}

/**
 * 製品名からブランド抽出
 */
export function extractBrandFromText(text: string): string | undefined {
  if (!text) return undefined;
  
  const lowerText = text.toLowerCase();
  
  for (const brand of KNOWN_BRANDS) {
    if (lowerText.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  return undefined;
}

/**
 * ドメインからブランド判定（強化版）
 */
export function getBrandFromDomain(url: string): string | undefined {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    // 既存ブランド
    if (domain.includes('arcteryx')) return "Arc'teryx";
    if (domain.includes('patagonia')) return 'Patagonia';
    if (domain.includes('montbell')) return 'Montbell';
    if (domain.includes('thenorthface')) return 'The North Face';
    if (domain.includes('coleman')) return 'Coleman';
    if (domain.includes('snowpeak')) return 'Snow Peak';
    
    // UL（ウルトラライト）系ブランド
    if (domain.includes('hyperlitemountaingear')) return 'Hyperlite Mountain Gear';
    if (domain.includes('zpacks')) return 'Zpacks';
    if (domain.includes('gossamer')) return 'Gossamer Gear';
    if (domain.includes('six-moon') || domain.includes('sixmoon')) return 'Six Moon Designs';
    if (domain.includes('mountainlaureldesigns') || domain.includes('mldpack')) return 'Mountain Laurel Designs';
    if (domain.includes('ula-equipment')) return 'ULA Equipment';
    
    // 日本のアウトドアブランド
    if (domain.includes('finetrack')) return 'finetrack';
    if (domain.includes('bring.org')) return 'Bring';
    
    return undefined;
  } catch {
    return undefined;
  }
}
