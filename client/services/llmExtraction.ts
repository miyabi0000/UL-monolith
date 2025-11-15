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
    };
  }
}

// Removed: adaptToUserCategories()
// Category matching is now handled server-side by CategoryMatcher
