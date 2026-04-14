import { DEFAULT_JAPANESE_COLOR, JAPANESE_COLOR_SET } from './japaneseColors.js';

/**
 * カテゴリバリデーションユーティリティ
 */

export interface CategoryValidationError {
  field: string;
  message: string;
}

/**
 * カテゴリ名のバリデーション
 */
export function validateCategoryName(name: unknown): CategoryValidationError | null {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      field: 'name',
      message: 'Category name is required'
    };
  }

  if (name.length > 50) {
    return {
      field: 'name',
      message: 'Category name must be 50 characters or less'
    };
  }

  return null;
}

/**
 * カテゴリ色のバリデーション
 */
export function validateCategoryColor(color: unknown): CategoryValidationError | null {
  if (!color) return null; // オプショナル

  if (typeof color !== 'string' || !/^#[0-9A-F]{6}$/i.test(color)) {
    return {
      field: 'color',
      message: 'Invalid color format. Use hex color code (e.g., #FF5733)'
    };
  }

  if (!JAPANESE_COLOR_SET.has(color.toUpperCase())) {
    return {
      field: 'color',
      message: 'Color must be selected from the Japanese color palette'
    };
  }

  return null;
}

/**
 * カテゴリ入力の完全バリデーション
 */
export function validateCategoryInput(
  name: unknown,
  color?: unknown
): CategoryValidationError | null {
  const nameError = validateCategoryName(name);
  if (nameError) return nameError;

  if (color !== undefined) {
    const colorError = validateCategoryColor(color);
    if (colorError) return colorError;
  }

  return null;
}

/**
 * カテゴリ名の正規化
 */
export function normalizeCategoryName(name: string): string {
  return name.trim();
}

/**
 * デフォルト色
 */
export const DEFAULT_CATEGORY_COLOR = DEFAULT_JAPANESE_COLOR;
