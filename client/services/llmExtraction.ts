import { LLMExtractionResult } from '../types';

/**
 * Client-side LLM Extraction Service
 * This will eventually call server-side APIs
 */

/**
 * Extract gear information from URL (client-side wrapper)
 */
export async function extractFromUrl(url: string): Promise<LLMExtractionResult> {
  // TODO: Replace with actual API call to server
  // For now, return mock data
  return {
    name: 'Extracted Product',
    brand: 'Brand Name',
    weightGrams: 100,
    priceCents: 5000,
    suggestedCategory: 'Other',
    confidence: 0.8
  };
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
