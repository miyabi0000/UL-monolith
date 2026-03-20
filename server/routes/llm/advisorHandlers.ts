import { Request, Response } from 'express';
import { llmService } from '../../services/llmService.js';

/**
 * POST /api/v1/llm/advisor - ギアアドバイザーチャット
 * ギアリストのコンテキストを持ちながらLLMとマルチターン会話を行う
 */
export const handleAdvisorChat = async (req: Request, res: Response) => {
  try {
    const { conversation, gearContext } = req.body;

    // バリデーション
    if (!conversation || !Array.isArray(conversation)) {
      return res.status(400).json({
        success: false,
        message: 'conversation (array) is required'
      });
    }

    if (conversation.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'conversation must not be empty'
      });
    }

    if (!gearContext || !Array.isArray(gearContext.items)) {
      return res.status(400).json({
        success: false,
        message: 'gearContext.items (array) is required'
      });
    }

    // 会話履歴のロール検証
    const validRoles = ['user', 'assistant'];
    const isValidConversation = conversation.every(
      (msg: any) => validRoles.includes(msg.role) && typeof msg.content === 'string'
    );
    if (!isValidConversation) {
      return res.status(400).json({
        success: false,
        message: 'Each conversation message must have role ("user"|"assistant") and content (string)'
      });
    }

    console.log(`[LLM] Advisor chat - ${gearContext.items.length} items, ${conversation.length} messages`);

    const result = await llmService.advisorChat(conversation, gearContext);

    res.json({
      success: true,
      data: result,
      message: 'Advisor response generated'
    });
  } catch (error) {
    console.error('[LLM] Advisor chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get advisor response',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
