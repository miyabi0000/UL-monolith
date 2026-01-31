/**
 * サーバーサイド型定義
 * クライアントサイドの型定義と同期を保つ
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

// ==================== エンティティ ====================

export interface GearItem {
  id: string;
  name: string;
  brand?: string;
  categoryId?: string;

  // 会計軸
  weightClass: WeightClass;

  // 重量（信頼度付き）
  weightGrams?: number;
  weightConfidence: WeightConfidence;
  weightSource: WeightSource;

  priceCents?: number;
  requiredQuantity: number;
  ownedQuantity: number;
  priority: number;
  seasons?: ('spring' | 'summer' | 'fall' | 'winter')[]; // Multiple seasons selection
  productUrl?: string;
  imageUrl?: string; // 商品画像URL

  // キット包含フラグ
  isInKit: boolean;

  createdAt: Date;
  updatedAt: Date;
  llmData?: {
    extractedFields?: string[];
    source?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  color: string;
  tags: string[]; // Big3タグ等
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMExtractionResult {
  name: string;
  brand?: string;
  categoryId?: string;
  weightGrams?: number;
  priceCents?: number;
  requiredQuantity: number;
  ownedQuantity: number;
  priority: number;
  seasons?: ('spring' | 'summer' | 'fall' | 'winter')[];
  productUrl?: string;
  imageUrl?: string; // 商品画像URL
  suggestedCategory?: string; // LLMが推測したカテゴリ名
  extractedFields?: string[];
  source?: string;
}

export interface GearItemForm {
  name: string;
  brand?: string;
  categoryId?: string;
  weightClass: WeightClass;
  weightGrams?: number;
  weightConfidence: WeightConfidence;
  weightSource: WeightSource;
  priceCents?: number;
  requiredQuantity: number;
  ownedQuantity: number;
  priority: number;
  seasons?: ('spring' | 'summer' | 'fall' | 'winter')[];
  productUrl?: string;
  imageUrl?: string; // 商品画像URL
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

// ==================== 集計（派生値） ====================

// 重量内訳
export interface WeightBreakdown {
  baseWeight: number;      // Base装備の合計
  wornWeight: number;      // Worn装備の合計
  consumables: number;     // 消耗品の合計
  packedWeight: number;    // Base + Consumables
  skinOutWeight: number;   // Base + Worn + Consumables
  big3: number;            // Backpack + Shelter + Sleep
}

// コスト内訳
export interface CostBreakdown {
  ownedCost: number;
  needCost: number;   // need + partial
  totalCost: number;
}

// UL分類
export type ULClassification = 'ultralight' | 'lightweight' | 'traditional';

export interface ULStatus {
  classification: ULClassification;
  baseWeight: number;
  threshold: number;
}

// UL基準値（定数）
export const UL_THRESHOLDS = {
  ultralight: 4500,    // < 4.5kg
  lightweight: 9000,   // < 9kg
} as const;
