import { Router } from 'express';
import { handleExtractUrl, handleExtractPrompt, handleEnhancePrompt } from './llm/extractHandlers';
import { handleExtractCategory } from './llm/categoryHandlers';
import { handleHealthCheck } from './llm/healthHandlers';

const router = Router();

// Extraction endpoints
router.post('/extract-url', handleExtractUrl);
router.post('/extract-prompt', handleExtractPrompt);
router.post('/enhance-prompt', handleEnhancePrompt);

// Category endpoints
router.post('/extract-category', handleExtractCategory);

// Health endpoint
router.get('/health', handleHealthCheck);

export default router;