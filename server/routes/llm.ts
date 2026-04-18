import { Router } from 'express';
import { handleExtractUrl, handleExtractPrompt, handleEnhancePrompt } from './llm/extractHandlers.js';
import { handleExtractCategory } from './llm/categoryHandlers.js';
import { handleHealthCheck } from './llm/healthHandlers.js';
import { handleAdvisorChat, handleAdvisorChatStream } from './llm/advisorHandlers.js';
import { quotaCheck } from '../middleware/quotaCheck.js';

const router = Router();

router.post('/extract-url', quotaCheck('url'), handleExtractUrl);
router.post('/extract-prompt', quotaCheck('url'), handleExtractPrompt);
router.post('/enhance-prompt', quotaCheck('url'), handleEnhancePrompt);
router.post('/extract-category', quotaCheck('url'), handleExtractCategory);

router.post('/advisor', quotaCheck('chat'), handleAdvisorChat);
router.post('/advisor/stream', quotaCheck('chat'), handleAdvisorChatStream);

// health はクォータ対象外
router.get('/health', handleHealthCheck);

export default router;
