import { LLMExtractionResult } from '../types';
import { callAPIWithRetry, API_ENDPOINTS, API_CONFIG } from './api.client';

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
  try {
    const response = await callAPIWithRetry(
      '/llm/extract-prompt',
      { prompt },
      API_CONFIG.timeout.standard
    );
    
    if (!response.success) {
      throw new APIError(response.message || 'Failed to extract gear from prompt');
    }
    
    return response.data;
  } catch (error) {
    console.error('Extract from prompt failed:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to extract gear information from prompt');
  }
}

/**
 * Extract gear information from URL
 */
export async function extractFromUrl(url: string): Promise<LLMExtractionResult> {
  try {
    const response = await callAPIWithRetry(
      '/llm/extract-url',
      { url },
      API_CONFIG.timeout.heavy
    );
    
    if (!response.success) {
      throw new APIError(response.message || 'Failed to extract gear from URL');
    }
    
    return response.data;
  } catch (error) {
    console.error('Extract from URL failed:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to extract gear information from URL');
  }
}

/**
 * Enhance URL data with prompt information
 */
export async function enhanceUrlDataWithPrompt(
  urlData: LLMExtractionResult,
  prompt: string
): Promise<LLMExtractionResult> {
  try {
    const response = await callAPIWithRetry(
      '/llm/enhance-prompt',
      { urlData, prompt },
      API_CONFIG.timeout.standard
    );
    
    if (!response.success) {
      throw new APIError(response.message || 'Failed to enhance URL data with prompt');
    }
    
    return response.data;
  } catch (error) {
    console.error('Enhance with prompt failed:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to enhance URL data with prompt');
  }
}

/**
 * Extract category from prompt
 */
export async function extractCategoryFromPrompt(prompt: string): Promise<{ name: string; englishName: string } | null> {
  try {
    const response = await callAPIWithRetry(
      '/llm/extract-category',
      { prompt },
      API_CONFIG.timeout.standard
    );
    
    if (!response.success) {
      throw new APIError(response.message || 'Failed to extract category from prompt');
    }
    
    return response.data;
  } catch (error) {
    console.error('Extract category failed:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to extract category from prompt');
  }
}


/**
 * Check API health
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await callAPIWithRetry(
      '/llm/health',
      {},
      API_CONFIG.timeout.light,
      'GET'
    );
    
    return response.success && response.data?.isHealthy;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
