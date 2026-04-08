// 重量単位変換ユーティリティ
// DBはグラム保存のまま、表示層・入力層・CSV入出力で変換する

export type WeightUnit = 'g' | 'oz';

// --- 定数 ---
const OZ_PER_GRAM = 1 / 28.3495;
const GRAM_PER_OZ = 28.3495;

// UL判定閾値（グラム基準）
export const UL_THRESHOLDS = {
  ultralight: 4500,  // 4.5kg
  lightweight: 9000, // 9.0kg
} as const;

// --- 変換 ---

/** グラム → 指定単位に変換 */
export function convertFromGrams(grams: number, unit: WeightUnit): number {
  if (unit === 'oz') return Math.round(grams * OZ_PER_GRAM * 100) / 100;
  return grams;
}

/** 指定単位 → グラムに変換（入力値のDB保存用） */
export function convertToGrams(value: number, unit: WeightUnit): number {
  if (unit === 'oz') return Math.round(value * GRAM_PER_OZ);
  return value;
}

// --- フォーマット ---

/** 重量を単位付きで表示 */
export function formatWeight(grams: number | undefined | null, unit: WeightUnit): string {
  if (grams == null || grams === 0) return '—';
  const value = convertFromGrams(grams, unit);
  return unit === 'oz' ? `${value} oz` : `${value}g`;
}

/** 重量の単位ラベルのみ */
export function weightUnitLabel(unit: WeightUnit): string {
  return unit === 'oz' ? 'oz' : 'g';
}

// --- kg/lb 表示（合計重量向け） ---

/** グラム → kg or lb で表示（パック合計等の大きい重量用） */
export function formatWeightLarge(grams: number | undefined | null, unit: WeightUnit): string {
  if (grams == null || grams === 0) return '—';
  if (unit === 'oz') {
    const lb = grams * OZ_PER_GRAM / 16;
    return `${lb.toFixed(2)} lb`;
  }
  const kg = grams / 1000;
  return `${kg.toFixed(2)} kg`;
}

// --- UL判定 ---

/** ベースウェイト（グラム）からUL分類を返す */
export function classifyUL(baseWeightGrams: number): 'ultralight' | 'lightweight' | 'traditional' {
  if (baseWeightGrams < UL_THRESHOLDS.ultralight) return 'ultralight';
  if (baseWeightGrams < UL_THRESHOLDS.lightweight) return 'lightweight';
  return 'traditional';
}

/** UL閾値を指定単位でフォーマット */
export function formatULThreshold(thresholdGrams: number, unit: WeightUnit): string {
  return formatWeightLarge(thresholdGrams, unit);
}

// --- CSV 入出力 ---

/** CSV ヘッダーの重量カラム名を生成 */
export function csvWeightHeader(unit: WeightUnit): string {
  return unit === 'oz' ? 'weight_oz' : 'weight_g';
}

/** CSV 出力用: グラム → 指定単位の数値 */
export function toCSVWeight(grams: number | undefined | null, unit: WeightUnit): string {
  if (grams == null) return '';
  return String(convertFromGrams(grams, unit));
}

/** CSV 入力用: 単位付き文字列またはヘッダーから単位を推定してグラムに変換 */
export function parseCSVWeight(
  value: string,
  headerOrUnit?: string
): { grams: number; detectedUnit: WeightUnit } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // 単位付き値を解析: "100g", "3.5oz", "3.5 oz" 等
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(g|oz|grams?|ounces?)?$/i);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  const unitStr = (match[2] || '').toLowerCase();

  // 値に単位が付いている場合はそちらを優先
  if (unitStr.startsWith('oz') || unitStr.startsWith('ounce')) {
    return { grams: convertToGrams(num, 'oz'), detectedUnit: 'oz' };
  }
  if (unitStr === 'g' || unitStr.startsWith('gram')) {
    return { grams: convertToGrams(num, 'g'), detectedUnit: 'g' };
  }

  // 値に単位がない場合、ヘッダーから推定
  if (headerOrUnit) {
    const h = headerOrUnit.toLowerCase();
    if (h.includes('oz') || h.includes('ounce')) {
      return { grams: convertToGrams(num, 'oz'), detectedUnit: 'oz' };
    }
  }

  // デフォルト: グラムとして扱う
  return { grams: num, detectedUnit: 'g' };
}
