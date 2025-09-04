import { API_CONFIG, API_ENDPOINTS, callAPIWithRetry } from '../config/api'
import { LLMExtractionResult } from '../types'

/**
 * Backend API Integration - Production Ready
 */

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * プロンプトからギア情報を抽出
 */
export async function extractGearFromPrompt(prompt: string): Promise<LLMExtractionResult> {
  const response = await callAPIWithRetry(
    API_ENDPOINTS.llm.extractGear, 
    { prompt },
    API_CONFIG.timeout.standard
  )

  if (!response.success) {
    throw new APIError(
      response.message || 'ギア情報の抽出に失敗しました',
      response.status,
      response.code
    )
  }

  const data = response.data
  return {
    name: data.name,
    brand: data.brand || null,
    weightGrams: data.weightGrams || null,
    priceCents: data.priceCents || null,
    suggestedCategory: data.suggestedCategory || 'Other',
    confidence: data.confidence || 0.7
  }
}

/**
 * URLからギア情報を抽出（バックエンド経由・スクレイピング含む）
 */
export async function extractGearFromUrl(url: string): Promise<LLMExtractionResult> {
  const response = await callAPIWithRetry(
    API_ENDPOINTS.llm.extractUrl,
    { url },
    API_CONFIG.timeout.heavy // URL処理は重い処理
  )

  if (!response.success) {
    throw new APIError(
      response.message || 'URL情報の抽出に失敗しました',
      response.status,
      response.code
    )
  }

  const data = response.data
  return {
    name: data.name || 'Unknown Product',
    brand: data.brand || null,
    weightGrams: data.weightGrams || null,
    priceCents: data.priceCents || null,
    suggestedCategory: data.suggestedCategory || 'Other',
    confidence: data.confidence || 0.7
  }
}

/**
 * URL抽出結果をプロンプト情報で拡張（バックエンド経由）
 */
export async function enhanceWithPrompt(
  urlData: LLMExtractionResult, 
  prompt: string
): Promise<LLMExtractionResult> {
  const response = await callAPIWithRetry(
    API_ENDPOINTS.llm.enhanceWithPrompt,
    { urlData, prompt },
    API_CONFIG.timeout.standard
  )

  if (!response.success) {
    throw new APIError(
      response.message || '情報統合に失敗しました',
      response.status,
      response.code
    )
  }

  const data = response.data
  return {
    name: data.name || urlData.name,
    brand: data.brand || urlData.brand,
    weightGrams: data.weightGrams || urlData.weightGrams,
    priceCents: data.priceCents || urlData.priceCents,
    suggestedCategory: data.suggestedCategory || urlData.suggestedCategory,
    confidence: Math.max(0.0, Math.min(1.0, data.confidence || urlData.confidence))
  }
}

/**
 * カテゴリ名を抽出・正規化（バックエンド経由）
 */
export async function extractCategory(prompt: string): Promise<{ name: string; englishName: string } | null> {
  try {
    const response = await callAPIWithRetry(
      API_ENDPOINTS.llm.extractCategory,
      { prompt },
      API_CONFIG.timeout.standard
    )

    if (!response.success || !response.data) {
      return null
    }

    const data = response.data
    return {
      name: data.name,
      englishName: data.englishName
    }
  } catch (error) {
    // カテゴリ抽出はオプショナルなので null を返す
    console.warn('Category extraction failed:', error)
    return null
  }
}

/**
 * ギアリスト分析（バックエンド経由）
 */
export async function analyzeGearList(gearItems: any[]): Promise<{ summary: string; tips: string[] }> {
  const response = await callAPIWithRetry(
    API_ENDPOINTS.llm.analyzeList,
    { gearItems },
    API_CONFIG.timeout.heavy // リスト分析は重い処理
  )

  if (!response.success) {
    throw new APIError(
      response.message || 'リスト分析に失敗しました',
      response.status,
      response.code
    )
  }

  const data = response.data
  return {
    summary: data.summary || 'リストの分析を完了しました。',
    tips: data.tips || ['適切な軽量化提案が生成できませんでした。']
  }
}

/**
 * API Health Check（バックエンド経由）
 */
export async function checkAPIHealth(): Promise<{ isHealthy: boolean; message?: string }> {
  try {
    const response = await callAPIWithRetry(
      API_ENDPOINTS.llm.healthCheck,
      {},
      API_CONFIG.timeout.light // ヘルスチェックは軽量処理
    )

    return {
      isHealthy: response.success || false,
      message: response.message
    }
  } catch (error) {
    return {
      isHealthy: false,
      message: error instanceof Error ? error.message : 'Health check failed'
    }
  }
}

/**
 * バックエンドAPI接続テスト
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    const health = await checkAPIHealth()
    return health.isHealthy
  } catch (error) {
    console.error('Backend connection test failed:', error)
    return false
  }
}