// 簡素化された型定義

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

  // 数量・重量
  requiredQuantity: number;
  ownedQuantity: number;
  weightGrams?: number;

  // 価格・メタ
  priceCents?: number;
  seasons?: ('spring' | 'summer' | 'fall' | 'winter')[]; // Multiple seasons selection
  priority: number; // 1-5

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
  category?: Category; // join結果
}

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

export type ChartViewMode = 'weight' | 'cost';
export type QuantityDisplayMode = 'owned' | 'required';

// Gear field values type for type-safe updates
export type GearFieldValue = string | number | null | string[] | boolean;

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
  weightGrams?: number;
  priceCents?: number;
  season?: string;
  priority: number;
}

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

  // 価格・メタ
  priceCents?: number;
  season?: string;
  priority?: number;

  // LLM固有
  suggestedCategory?: string;
  categoryId?: string; // マッチしたカテゴリID

  // 抽出メタデータ
  extractedFields: string[]; // 実際に抽出できたフィールド名
  source: 'web_scraping' | 'llm_prompt' | 'enhanced' | 'fallback';
}


