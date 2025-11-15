import { LLMExtractionResult, Category } from './types'

/**
 * URL付きの抽出結果型
 */
export interface ExtractedGearWithUrl extends LLMExtractionResult {
  url: string
}

/**
 * LLM抽出結果がフォールバック（失敗）かどうかを判定
 */
export function isFallbackResult(data: LLMExtractionResult): boolean {
  return (
    data.source === 'fallback' ||
    !data.name ||
    data.name.includes('Failed to Extract') ||
    data.name.includes('Product from') ||
    data.name === 'Unknown Product'
  )
}

/**
 * 抽出できたフィールド名のリストを取得
 */
export function getExtractedFieldNames(data: LLMExtractionResult): string[] {
  return Object.keys(data).filter(key =>
    data[key as keyof LLMExtractionResult] !== undefined &&
    data[key as keyof LLMExtractionResult] !== null &&
    key !== 'extractedFields' &&
    key !== 'source' &&
    key !== 'confidence'
  )
}

/**
 * カテゴリ名からカテゴリIDをマッチング
 */
export function matchCategoryId(
  categoryName: string | undefined,
  categories: Category[]
): string | undefined {
  if (!categoryName) return undefined
  return categories.find(cat => cat.name === categoryName)?.id
}

/**
 * 抽出結果にカテゴリIDとURLを追加
 */
export function enrichExtractionResult(
  data: LLMExtractionResult,
  url: string,
  categories: Category[]
): ExtractedGearWithUrl {
  return {
    ...data,
    url,
    categoryId: matchCategoryId(data.suggestedCategory, categories),
    extractedFields: getExtractedFieldNames(data)
  }
}
