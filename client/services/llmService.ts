import { LLMExtractionResult } from '../types';

/**
 * Client-side LLM Service
 * Wrapper for server-side API calls
 */

export class APIError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Extract gear information from prompt
 */
export async function extractFromPrompt(prompt: string): Promise<LLMExtractionResult> {
  // TODO: Replace with actual API call to server
  // For now, return mock data
  return {
    name: 'Extracted Gear',
    brand: 'Brand Name',
    weightGrams: 150,
    priceCents: 8000,
    suggestedCategory: 'Other',
    confidence: 0.7
  };
}

/**
 * Extract gear information from URL
 */
export async function extractFromUrl(url: string): Promise<LLMExtractionResult> {
  // TODO: Replace with actual API call to server
  return {
    name: 'Product from URL',
    brand: 'URL Brand',
    weightGrams: 200,
    priceCents: 12000,
    suggestedCategory: 'Other',
    confidence: 0.8
  };
}

/**
 * Enhance URL data with prompt information
 */
export async function enhanceUrlDataWithPrompt(
  urlData: LLMExtractionResult,
  prompt: string
): Promise<LLMExtractionResult> {
  // TODO: Replace with actual API call to server
  return {
    ...urlData,
    confidence: Math.max(urlData.confidence, 0.85)
  };
}

/**
 * Extract category from prompt
 */
export async function extractCategoryFromPrompt(prompt: string): Promise<{ name: string; englishName: string } | null> {
  // TODO: Replace with actual API call to server
  return {
    name: 'カテゴリ名',
    englishName: 'Category Name'
  };
}

/**
 * Analyze gear list
 */
export async function analyzeGearList(gearItems: any[]): Promise<{ summary: string; tips: string[] }> {
  // TODO: Replace with actual API call to server
  return {
    summary: 'Your gear list analysis summary',
    tips: [
      'Consider lighter alternatives',
      'You might be missing some essentials',
      'Great selection overall!'
    ]
  };
}

/**
 * Check API health
 */
export async function checkAPIHealth(): Promise<boolean> {
  // TODO: Replace with actual API call to server
  return true;
}
