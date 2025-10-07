/**
 * サーバーサイド型定義
 * クライアントサイドの型定義と同期を保つ
 */

export interface GearItem {
  id: string;
  name: string;
  brand?: string;
  categoryId?: string;
  weightGrams?: number;
  priceCents?: number;
  requiredQuantity: number;
  ownedQuantity: number;
  priority: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  productUrl?: string;
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
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  productUrl?: string;
  extractedFields?: string[];
  source?: string;
}

export interface GearItemForm {
  name: string;
  brand?: string;
  categoryId?: string;
  weightGrams?: number;
  priceCents?: number;
  requiredQuantity: number;
  ownedQuantity: number;
  priority: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  productUrl?: string;
}

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
