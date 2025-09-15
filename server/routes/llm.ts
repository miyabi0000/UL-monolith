import { Router } from 'express';
import { handleExtractUrl, handleExtractPrompt } from './llm/extractHandlers';
import { handleExtractCategory, handleAnalyzeGearList } from './llm/categoryHandlers';
import { handleHealthCheck } from './llm/healthHandlers';

const router = Router();

// Extraction endpoints
router.post('/extract-url', handleExtractUrl);
router.post('/extract-prompt', handleExtractPrompt);

// Category and analysis endpoints
router.post('/extract-category', handleExtractCategory);
router.post('/analyze-gear-list', handleAnalyzeGearList);

// Health endpoint
router.get('/health', handleHealthCheck);

export default router;