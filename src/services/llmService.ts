import { LLMExtractionResult } from '../types';
import * as BackendAPI from './backendApiService';

/**
 * LLM Service - Production Ready (Real API Only)
 */

/**
 * プロンプトからギア情報を抽出
 */
export async function extractFromPrompt(prompt: string): Promise<LLMExtractionResult> {
  return BackendAPI.extractGearFromPrompt(prompt);
}

/**
 * URLからギア情報を抽出
 */
export async function extractFromUrl(url: string): Promise<LLMExtractionResult> {
  if (!url || !url.startsWith('http')) {
    throw new Error('Invalid URL provided');
  }

  return BackendAPI.extractGearFromUrl(url);
}

/**
 * URL抽出結果をプロンプト情報で拡張
 */
export async function enhanceUrlDataWithPrompt(
  urlData: LLMExtractionResult,
  prompt: string
): Promise<LLMExtractionResult> {
  return BackendAPI.enhanceWithPrompt(urlData, prompt);
}

/**
 * プロンプトからカテゴリ名を抽出・正規化
 */
export async function extractCategoryFromPrompt(prompt: string): Promise<{ name: string; englishName: string } | null> {
  return BackendAPI.extractCategory(prompt);
}

/**
 * ギアリスト分析
 */
export async function analyzeGearList(gearItems: any[]): Promise<{ summary: string; tips: string[] }> {
  if (!gearItems || gearItems.length === 0) {
    throw new Error('分析するギアリストが空です');
  }

  return BackendAPI.analyzeGearList(gearItems);
}

/**
 * API Health Check
 */
export async function checkAPIHealth(): Promise<boolean> {
  const result = await BackendAPI.checkAPIHealth();
  return result.isHealthy;
}

/**
 * Backend connection test
 */
export async function testBackendConnection(): Promise<boolean> {
  return BackendAPI.testBackendConnection();
}

/**
 * Re-export APIError for convenience
 */
export { APIError } from './backendApiService';