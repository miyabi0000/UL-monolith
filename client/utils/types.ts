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
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
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
  value: number;
  color: string;
  items: GearItemWithCalculated[];
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


