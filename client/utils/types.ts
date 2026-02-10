// 簡素化された型定義

// ==================== 意味論軸の型定義 ====================

// 会計軸（Accounting）
export type WeightClass = 'base' | 'worn' | 'consumable';

// 重量信頼度
export type WeightConfidence = 'high' | 'med' | 'low';

// 重量ソース
export type WeightSource = 'manual' | 'jsonld' | 'og' | 'html' | 'llm';

// 調達状態（派生）
export type ProcurementStatus = 'owned' | 'partial' | 'need';

// 優先度
export type Priority = 0 | 1 | 2 | 3;

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

export interface User {
  id: string;
  email: string;
  name?: string; // Add name property for display
  createdAt: string;
}

export interface Category {
  id: string;
  userId?: string; // null = global category
  name: string;
  parentId?: string;
  path: string[]; // ['Clothing', 'Outerwear', 'Jacket']
  color: string; // hex color
  tags: string[]; // Big3タグ等（'big3_pack', 'big3_shelter', 'big3_sleep'）
  createdAt: string;
}

export interface GearItem {
  id: string;
  userId: string;
  categoryId?: string;

  // 基本情報
  name: string;
  brand?: string;
  productUrl?: string;
  imageUrl?: string; // 商品画像URL

  // 数量（調達軸）
  requiredQuantity: number;
  ownedQuantity: number;

  // 会計軸
  weightClass: WeightClass; // 'base' | 'worn' | 'consumable'

  // 重量（信頼度付き）
  weightGrams?: number;
  weightConfidence: WeightConfidence; // 'high' | 'med' | 'low'
  weightSource: WeightSource; // 'manual' | 'jsonld' | 'og' | 'html' | 'llm'

  // 価格・メタ
  priceCents?: number;
  seasons?: ('spring' | 'summer' | 'fall' | 'winter')[]; // Multiple seasons selection
  priority: number; // 1-5

  // キット包含フラグ
  isInKit: boolean; // 集計対象フラグ

  // LLM
  llmData?: {
    extracted: any;
    extractedAt: string;
  };

  createdAt: string;
  updatedAt: string;
}

// 計算フィールド（バックエンドで算出）
export interface GearItemWithCalculated extends GearItem {
  shortage: number; // requiredQuantity - ownedQuantity
  totalWeight: number; // weightGrams * requiredQuantity
  totalPrice: number; // priceCents * requiredQuantity
  missingQuantity: number; // Math.max(0, requiredQuantity - ownedQuantity)
  procurementStatus: ProcurementStatus; // 派生: owned | partial | need
  category?: Category; // join結果
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
  big3Pack: number;        // バックパックの重量
  big3Shelter: number;     // シェルターの重量
  big3Sleep: number;       // スリープシステムの重量
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
  threshold: number;  // 4500 for UL
}

// UL基準値（定数）
export const UL_THRESHOLDS = {
  ultralight: 4500,    // < 4.5kg
  lightweight: 9000,   // < 9kg
} as const;

export interface GearList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
}

// チャート用データ
export interface ChartData {
  name: string;
  value: number; // 現在表示中の値（weight or cost or itemCount）
  weight: number; // 重量
  cost: number; // コスト（priceCents）
  itemCount: number; // アイテム数
  color: string;
  items: GearItemWithCalculated[];
}

// Weight-Class用チャートデータ
export interface WeightClassChartData {
  name: 'Base' | 'Worn' | 'Consumable';
  value: number; // 重量
  color: string;
  items: GearItemWithCalculated[];
}

// Weight-Class用カラー定義
export const WEIGHT_CLASS_COLORS = {
  base: '#6B7280',      // gray-500
  worn: '#3B82F6',      // blue-500
  consumable: '#F97316' // orange-500
} as const;

export type ChartViewMode = 'weight' | 'cost' | 'weight-class';
// owned: 所持分, need: 不足分, all: 必要数（総数）
export type QuantityDisplayMode = 'owned' | 'need' | 'all';
export type ViewMode = 'table' | 'card' | 'compare';

// Gear field values type for type-safe updates
export type GearFieldValue = string | number | null | string[] | boolean;

// ==================== 二重ドーナツチャート ====================

// フォーカス状態（Inner ringの選択状態）
export type ChartFocus = 'all' | 'big3' | 'other';

// スコープ（集計対象のweight_class範囲）
export type ChartScope = 'base' | 'packed' | 'skinout';

// ドーナツセグメント
export interface DonutSegment {
  id: string;           // 'big3' | 'other' | categoryId | 'big3_pack' etc.
  label: string;
  value: number;        // weight in grams
  color: string;
  isBig3?: boolean;
  items: GearItemWithCalculated[];
}

// 二重ドーナツ用カラートークン
export const DUAL_RING_COLORS = {
  // Inner ring（濃い色でコントラスト強調）
  big3: '#7C3AED',        // violet-600（より濃い紫）
  other: '#4B5563',       // gray-600（より濃いグレー）
  // Big3内訳（Outer ring when focus='big3'）
  big3_pack: '#6D28D9',   // violet-700
  big3_shelter: '#8B5CF6', // violet-500
  big3_sleep: '#A78BFA'   // violet-400
} as const;

// ==================== ギア比較機能 ====================

// 比較ソートキー
export type ComparisonSortKey = 'price' | 'weight' | 'efficiency'; // efficiency = g/¥

// 比較プリセット
export type ComparisonPreset = 'lightest' | 'cheapest' | 'best-value' | 'balanced';

// 比較状態
export interface ComparisonState {
  itemIds: string[]; // 最大4件
  categoryId: string | null; // 同一カテゴリ制約
  baselineItemId: string | null; // ベースライン（現行装備）
  sortKey: ComparisonSortKey;
  preset: ComparisonPreset | null;
}

// 比較メトリクス
export interface ComparisonMetrics {
  efficiency: number; // g/¥ (weight / price)
  categorySpecific?: {
    volumeToWeight?: number; // Backpack: 容量/重量
    warmthToWeight?: number; // Sleep System: 暖かさ/重量
  };
}

// 意思決定サマリー
export interface DecisionSummary {
  deltaWeight: number; // 総重量の差分（g）
  deltaCost: number; // 総コストの差分（円）
  adoptedItemId: string | null;
}

// API レスポンス
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// フォーム用
export interface GearItemForm {
  name: string;
  brand?: string;
  productUrl?: string;
  imageUrl?: string; // 商品画像URL
  categoryId?: string;
  requiredQuantity: number;
  ownedQuantity: number;
  weightClass: WeightClass;
  weightGrams?: number;
  weightConfidence: WeightConfidence;
  weightSource: WeightSource;
  priceCents?: number;
  season?: string;
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

export interface LLMExtractionResult {
  // 基本情報 - GearItemFormと完全対応
  name?: string;
  brand?: string;
  productUrl?: string;
  imageUrl?: string; // 商品画像URL

  // 数量・重量
  requiredQuantity?: number;
  ownedQuantity?: number;
  weightGrams?: number;
  weightConfidence?: WeightConfidence;

  // 価格・メタ
  priceCents?: number;
  season?: string;
  priority?: number;

  // LLM固有
  suggestedCategory?: string;
  categoryId?: string; // マッチしたカテゴリID
  suggestedWeightClass?: WeightClass; // LLMが推測した会計区分

  // 抽出メタデータ
  extractedFields: string[]; // 実際に抽出できたフィールド名
  source: 'web_scraping' | 'llm_prompt' | 'enhanced' | 'fallback';
}
