import { LLMExtractionResult } from '../../models/types.js';

/**
 * 抽出結果の値域検証・サニタイズ
 *
 * スクレイピング/LLM フォールバック/Amazon スクレイパーのいずれから来ても、
 * 明らかに不正な値 (負の重量、10kg 級の重量、0 円、異常に長い name、カテゴリ
 * 名の混入等) をここで弾いて品質を担保する。
 *
 * 方針: 不正な値は **削除** して `extractedFields` からも除外。
 *       フィールドごと保守的に判定し、少しでも怪しければ落とす。
 */

/** 値域 (環境やドメインを問わず固定) */
const LIMITS = {
  /** 重量: 0.1g 〜 100,000g (100kg、バックパックに入る最大想定) */
  weightMinGrams: 0.1,
  weightMaxGrams: 100_000,
  /** 価格: 0 cent を除外〜10,000,000 cent (日本円 100,000,000 円 / USD 100,000) */
  priceMinCents: 1,
  priceMaxCents: 10_000_000,
  /** name: 3〜300 文字 */
  nameMinLen: 3,
  nameMaxLen: 300,
  /** brand: 1〜80 文字 */
  brandMinLen: 1,
  brandMaxLen: 80,
} as const;

/** name として明らかに不適切な汎用プレースホルダー (大文字小文字を無視) */
const NAME_BLACKLIST = [
  'product',
  'unknown product',
  'product from url',
  'amazon product',
  'item',
  'untitled',
  'loading',
  'error',
];

/** brand として混入しやすいノイズ (カテゴリ名が brand に入る等) */
const BRAND_BLACKLIST = [
  'shelter',
  'clothing',
  'cooking',
  'safety',
  'backpack',
  'sleep',
  'water',
  'electronics',
  'hygiene',
  'other',
  'products',
  'item',
];

/**
 * 抽出結果を検証してサニタイズ済みの新しい結果を返す。
 * 不正なフィールドは削除し extractedFields からも除外。
 * source / productUrl / 数量系は変更しない。
 */
export function validateAndSanitize(data: LLMExtractionResult): LLMExtractionResult {
  const validFields = new Set(data.extractedFields || []);
  const clone: LLMExtractionResult = { ...data };

  // name
  if (!isValidName(clone.name)) {
    // name は必須なのでフォールバック文字列を維持するが extractedFields からは除外
    validFields.delete('name');
  }

  // brand
  if (clone.brand !== undefined && !isValidBrand(clone.brand)) {
    clone.brand = undefined;
    validFields.delete('brand');
  }

  // weightGrams
  if (clone.weightGrams !== undefined && !isValidWeight(clone.weightGrams)) {
    clone.weightGrams = undefined;
    validFields.delete('weightGrams');
  }

  // priceCents
  if (clone.priceCents !== undefined && !isValidPrice(clone.priceCents)) {
    clone.priceCents = undefined;
    validFields.delete('priceCents');
  }

  // imageUrl: http(s) で始まること
  if (clone.imageUrl !== undefined && !isValidImageUrl(clone.imageUrl)) {
    clone.imageUrl = undefined;
    validFields.delete('imageUrl');
  }

  clone.extractedFields = [...validFields];
  return clone;
}

// ==================== 個別判定 ====================

function isValidName(name: string | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length < LIMITS.nameMinLen || trimmed.length > LIMITS.nameMaxLen) return false;
  if (NAME_BLACKLIST.includes(trimmed.toLowerCase())) return false;
  return true;
}

function isValidBrand(brand: string): boolean {
  const trimmed = brand.trim();
  if (trimmed.length < LIMITS.brandMinLen || trimmed.length > LIMITS.brandMaxLen) return false;
  if (BRAND_BLACKLIST.includes(trimmed.toLowerCase())) return false;
  return true;
}

function isValidWeight(weight: number): boolean {
  if (!Number.isFinite(weight)) return false;
  return weight >= LIMITS.weightMinGrams && weight <= LIMITS.weightMaxGrams;
}

function isValidPrice(price: number): boolean {
  if (!Number.isFinite(price)) return false;
  if (!Number.isInteger(price)) return false; // cent 単位なので整数
  return price >= LIMITS.priceMinCents && price <= LIMITS.priceMaxCents;
}

function isValidImageUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}
