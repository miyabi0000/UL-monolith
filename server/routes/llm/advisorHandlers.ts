import { Request, Response } from 'express';
import { llmService } from '../../services/llmService.js';

type AdvisorRole = 'user' | 'assistant';

interface AdvisorMessage {
  role: AdvisorRole;
  content: string;
}

interface AdvisorRequestBody {
  conversation?: unknown;
  gearContext?: {
    items?: unknown;
    weightBreakdown?: unknown;
    ulStatus?: unknown;
  };
}

const isAdvisorRole = (value: unknown): value is AdvisorRole => {
  return value === 'user' || value === 'assistant';
};

const isAdvisorMessage = (value: unknown): value is AdvisorMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybe = value as { role?: unknown; content?: unknown };
  return isAdvisorRole(maybe.role) && typeof maybe.content === 'string';
};

/**
 * POST /api/v1/llm/advisor - ギアアドバイザーチャット
 * ギアリストのコンテキストを持ちながらLLMとマルチターン会話を行う
 */
export const handleAdvisorChat = async (req: Request, res: Response) => {
  try {
    const { conversation, gearContext } = req.body as AdvisorRequestBody;

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
    const items = gearContext.items as Record<string, unknown>[];

    // 会話履歴のロール検証
    const isValidConversation = conversation.every(isAdvisorMessage);
    if (!isValidConversation) {
      return res.status(400).json({
        success: false,
        message: 'Each conversation message must have role ("user"|"assistant") and content (string)'
      });
    }

    console.log(`[LLM] Advisor chat - ${items.length} items, ${conversation.length} messages`);

    const result = await llmService.advisorChat(conversation, {
      items,
      weightBreakdown: gearContext.weightBreakdown,
      ulStatus: gearContext.ulStatus,
    });

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
