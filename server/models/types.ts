/**
 * サーバーサイド型定義
 * NOTE: client/utils/types.ts と同期を保つこと
 */

// ==================== 意味論軸の型定義 ====================

// 会計軸（Accounting）
export type WeightClass = 'base' | 'worn' | 'consumable';

// 重量信頼度
export type WeightConfidence = 'high' | 'med' | 'low';

// 重量ソース
export type WeightSource = 'manual' | 'jsonld' | 'og' | 'html' | 'llm';

// 調達状態（派生）
export type ProcurementStatus = 'owned' | 'partial' | 'need';

// 派生関数
export function deriveStatus(required: number, owned: number): ProcurementStatus {
  if (owned >= required) return 'owned';
  if (owned === 0 && required > 0) return 'need';
  return 'partial';
}

// ==================== Big3ヘルパー ====================

// Big3タグ定義
export const BIG3_TAGS = ['big3_pack', 'big3_shelter', 'big3_sleep'] as const;
export type Big3Tag = typeof BIG3_TAGS[number];

/**
 * カテゴリがBig3かどうかを判定
 * Big3: Backpack, Shelter, Sleep System
 */
export function isBig3Category(category?: { tags?: string[] } | null): boolean {
  if (!category?.tags) return false;
  return category.tags.some(tag => (BIG3_TAGS as readonly string[]).includes(tag));
}

/**
 * Big3カテゴリ時にweightClassを'base'に矯正
 * @param weightClass 現在のweightClass
 * @param category カテゴリ情報
 * @returns 矯正後のweightClass
 */
export function enforceWeightClassForBig3(
  weightClass: WeightClass,
  category?: { tags?: string[] } | null
): WeightClass {
  return isBig3Category(category) ? 'base' : weightClass;
}

// ==================== エンティティ ====================

export interface Category {
  id: string;
  name: string;
  color: string;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface GearItem {
  id: string;
  userId?: string;
  categoryId?: string;
  name: string;
  brand?: string;
  productUrl?: string;
  imageUrl?: string;
  requiredQuantity: number;
  ownedQuantity: number;
  weightClass: WeightClass;
  weightGrams?: number;
  weightConfidence: WeightConfidence;
  weightSource: WeightSource;
  priceCents?: number;
  seasons?: ('spring' | 'summer' | 'fall' | 'winter')[];
  priority: number;
  isInKit: boolean;
  llmData?: {
    extractedFields?: string[];
    source?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GearItemForm {
  name: string;
  brand?: string;
  categoryId?: string;
  productUrl?: string;
  imageUrl?: string;
  requiredQuantity: number;
  ownedQuantity: number;
  weightClass: WeightClass;
  weightGrams?: number;
  weightConfidence: WeightConfidence;
  weightSource: WeightSource;
  priceCents?: number;
  seasons?: ('spring' | 'summer' | 'fall' | 'winter')[];
  priority: number;
  isInKit: boolean;
}

// デフォルト値
export const DEFAULT_GEAR_VALUES = {
  weightClass: 'base' as WeightClass,
  weightConfidence: 'low' as WeightConfidence,
  weightSource: 'manual' as WeightSource,
  isInKit: true,
  priority: 3,
  requiredQuantity: 1,
  ownedQuantity: 0,
} as const;

// ==================== LLM ====================

export interface LLMExtractionResult {
  name: string;
  brand?: string;
  categoryId?: string;
  productUrl?: string;
  imageUrl?: string;
  weightGrams?: number;
  weightConfidence?: WeightConfidence;
  priceCents?: number;
  requiredQuantity?: number;
  ownedQuantity?: number;
  priority?: number;
  seasons?: ('spring' | 'summer' | 'fall' | 'winter')[];
  suggestedCategory?: string;
  suggestedWeightClass?: WeightClass;
  extractedFields?: string[];
  source?: string;
  confidence?: number; // 抽出信頼度（0-1）
}

// ==================== 集計（派生値） ====================

export interface WeightBreakdown {
  baseWeight: number;
  wornWeight: number;
  consumables: number;
  packedWeight: number;
  skinOutWeight: number;
  big3: number;
}

export interface CostBreakdown {
  ownedCost: number;
  needCost: number;
  totalCost: number;
}

export type ULClassification = 'ultralight' | 'lightweight' | 'traditional';

export interface ULStatus {
  classification: ULClassification;
  baseWeight: number;
  threshold: number;
}

export const UL_THRESHOLDS = {
  ultralight: 4500,
  lightweight: 9000,
} as const;

// ==================== API ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  filtered: boolean;
}

export interface GearStats {
  totalItems: number;
  ownedItems: number;
  totalWeight: number;
  totalValue: number;
  categories: number;
}
