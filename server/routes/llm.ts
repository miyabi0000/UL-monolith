import { Router } from 'express';
import { handleExtractUrl, handleExtractPrompt, handleEnhancePrompt } from './llm/extractHandlers.js';
import { handleExtractCategory } from './llm/categoryHandlers.js';
import { handleHealthCheck } from './llm/healthHandlers.js';
import { handleAdvisorChat, handleAdvisorChatStream } from './llm/advisorHandlers.js';

const router = Router();

// Extraction endpoints
router.post('/extract-url', handleExtractUrl);
router.post('/extract-prompt', handleExtractPrompt);
router.post('/enhance-prompt', handleEnhancePrompt);

// Category endpoints
router.post('/extract-category', handleExtractCategory);

// Advisor endpoints
router.post('/advisor', handleAdvisorChat);
router.post('/advisor/stream', handleAdvisorChatStream);

// Health endpoint
router.get('/health', handleHealthCheck);

export default router;
