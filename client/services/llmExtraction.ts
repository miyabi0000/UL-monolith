import { LLMExtractionResult } from '../utils/types';
import { callAPIWithRetry, API_CONFIG } from './api.client';

/**
 * Client-side LLM Extraction Service
 */

/**
 * Extract gear information from URL using server-side API
 */
export async function extractFromUrl(url: string, userCategories?: string[]): Promise<LLMExtractionResult> {
  try {
    const response = await callAPIWithRetry('/llm/extract-url', {
      url,
      userCategories
    }, API_CONFIG.timeout.heavy);
    
    return response.data;
  } catch (error) {
    console.error('Failed to extract from URL:', error);
    // Fallback to mock data if API fails
    return {
      name: 'Unknown Product',
      confidence: 0.1
    };
  }
}

/**
 * Adapt extracted data to user's categories
 */
export function adaptToUserCategories(
  extractedData: LLMExtractionResult, 
  userCategories: string[]
): LLMExtractionResult {
  // Simple category matching logic
  const suggestedCategory = userCategories.find(cat => 
    cat.toLowerCase().includes(extractedData.suggestedCategory?.toLowerCase() || '')
  ) || extractedData.suggestedCategory || 'Other';

  return {
    ...extractedData,
    suggestedCategory
  };
}
