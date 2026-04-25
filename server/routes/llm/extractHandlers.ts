import { Request, Response } from 'express';
import { llmService } from '../../services/llmService.js';
import { CategoryMatcher } from '../../services/categoryMatcher.js';
import { recordUsage } from '../../services/quotaService.js';
import { logger } from '../../utils/logger.js';

const trackUrlUsage = (userId: string | undefined) => {
  if (userId) void recordUsage({ userId, endpoint: 'url' });
};

/**
 * POST /api/v1/llm/extract-url - URLからギア情報を抽出
 */
export const handleExtractUrl = async (req: Request, res: Response) => {
  try {
    const { url, userCategories } = req.body;
    
    // バリデーション
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // URL形式チェック
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    logger.info(`[LLM] Processing URL extraction: ${url}`);
    
    const extractionResult = await llmService.extractGearFromUrl(url);
    
    // 統一カテゴリマッチングを使用
    if (userCategories && Array.isArray(userCategories) && userCategories.length > 0) {
      const categoryNames = userCategories.map((cat: any) => cat.name || cat);
      extractionResult.suggestedCategory = CategoryMatcher.matchCategory(
        {
          productName: extractionResult.name,
          url: url,
          llmSuggestion: extractionResult.suggestedCategory,
        },
        categoryNames
      );
    }

    logger.info(`[LLM] URL extraction completed: ${extractionResult.name} → ${extractionResult.suggestedCategory}`);

    trackUrlUsage(req.userId);

    res.json({
      success: true,
      data: extractionResult,
      message: 'URL extraction completed successfully'
    });
  } catch (error) {
    logger.error({ err: error }, '[LLM] URL extraction error:');
    res.status(500).json({
      success: false,
      message: 'Failed to extract from URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * POST /api/v1/llm/extract-prompt - プロンプトからギア情報を抽出
 */
export const handleExtractPrompt = async (req: Request, res: Response) => {
  try {
    const { prompt, userCategories } = req.body;
    
    // バリデーション
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    if (typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Prompt must be a string'
      });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prompt cannot be empty'
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is too long (max 1000 characters)'
      });
    }

    logger.info(`[LLM] Processing prompt extraction: ${prompt.substring(0, 50)}...`);

    const extractionResult = await llmService.extractGearFromPrompt(prompt);

    // 統一カテゴリマッチングを使用
    if (userCategories && Array.isArray(userCategories) && userCategories.length > 0) {
      const categoryNames = userCategories.map((cat: any) => cat.name || cat);
      extractionResult.suggestedCategory = CategoryMatcher.matchCategory(
        {
          productName: extractionResult.name,
          llmSuggestion: extractionResult.suggestedCategory,
        },
        categoryNames
      );
    }

    logger.info(`[LLM] Prompt extraction completed: ${extractionResult.name} → ${extractionResult.suggestedCategory} (confidence: ${extractionResult.confidence})`);

    trackUrlUsage(req.userId);

    res.json({
      success: true,
      data: extractionResult,
      message: 'Prompt extraction completed successfully'
    });
  } catch (error) {
    logger.error({ err: error }, '[LLM] Prompt extraction error:');
    res.status(500).json({
      success: false,
      message: 'Failed to extract from prompt',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * POST /api/v1/llm/enhance-prompt - URL抽出結果をプロンプトで拡張
 */
export const handleEnhancePrompt = async (req: Request, res: Response) => {
  try {
    const { urlData, prompt } = req.body;
    
    // バリデーション
    if (!urlData) {
      return res.status(400).json({
        success: false,
        message: 'urlData is required'
      });
    }

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'prompt is required'
      });
    }

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'prompt must be a non-empty string'
      });
    }

    logger.info(`[LLM] Enhancing URL data with prompt: ${prompt.substring(0, 50)}...`);
    
    const enhancedResult = await llmService.enhanceWithPrompt(urlData, prompt);

    trackUrlUsage(req.userId);

    res.json({
      success: true,
      data: enhancedResult,
      message: 'Data enhancement completed successfully'
    });
  } catch (error) {
    logger.error({ err: error }, '[LLM] Enhancement error:');
    res.status(500).json({
      success: false,
      message: 'Failed to enhance data with prompt',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
