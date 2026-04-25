import { Request, Response } from 'express';
import { llmService } from '../../services/llmService.js';
import { logger } from '../../utils/logger.js';

export const handleExtractCategory = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    logger.info(`[LLM] Extracting category from: ${prompt.substring(0, 50)}...`);

    const categoryResult = await llmService.extractCategory(prompt);

    if (categoryResult) {
      res.json({
        success: true,
        data: categoryResult,
        message: 'Category extracted successfully'
      });
    } else {
      res.json({
        success: true,
        data: null,
        message: 'No specific category detected'
      });
    }
  } catch (error) {
    logger.error({ err: error }, '[LLM] Category extraction error:');
    res.status(500).json({
      success: false,
      message: 'Failed to extract category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
