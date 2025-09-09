/**
 * Server-side Data Models
 */

export interface GearItem {
  id: string;
  name: string;
  brand?: string;
  productUrl?: string;
  categoryId?: string;
  requiredQuantity: number;
  ownedQuantity: number;
  weightGrams?: number;
  priceCents?: number;
  season?: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GearItemForm {
  name: string;
  brand?: string;
  productUrl?: string;
  categoryId?: string;
  requiredQuantity: number;
  ownedQuantity: number;
  weightGrams?: number;
  priceCents?: number;
  season?: string;
  priority: number;
}

export interface Category {
  id: string;
  name: string;
  englishName?: string;
  color: string;
  parentId?: string;
  path: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryForm {
  name: string;
  englishName?: string;
  color: string;
  parentId?: string;
}

export interface LLMExtractionResult {
  name: string;
  brand?: string;
  weightGrams?: number;
  priceCents?: number;
  suggestedCategory?: string;
  confidence: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
  code?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
