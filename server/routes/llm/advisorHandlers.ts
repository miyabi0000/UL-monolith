import { Request, Response } from 'express';

type AdvisorRole = 'user' | 'assistant';

interface AdvisorMessage {
  role: AdvisorRole;
  content: string;
}

interface AdvisorRequestBody {
  conversation?: unknown;
  gearContext?: {
    items?: unknown;
  };
}

const isAdvisorMessage = (value: unknown): value is AdvisorMessage => {
  if (!value || typeof value !== 'object') return false;
  const msg = value as { role?: unknown; content?: unknown };
  return (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string';
};

/**
 * POST /api/v1/llm/advisor
 * 最小実装: UI 互換のレスポンスを返す
 */
export const handleAdvisorChat = async (req: Request, res: Response) => {
  const { conversation, gearContext } = req.body as AdvisorRequestBody;

  if (!Array.isArray(conversation) || conversation.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'conversation (non-empty array) is required',
    });
  }

  if (!conversation.every(isAdvisorMessage)) {
    return res.status(400).json({
      success: false,
      message: 'Each message must include role ("user"|"assistant") and content (string)',
    });
  }

  if (!gearContext || !Array.isArray(gearContext.items)) {
    return res.status(400).json({
      success: false,
      message: 'gearContext.items (array) is required',
    });
  }

  const lastUserMessage = [...conversation].reverse().find((msg) => msg.role === 'user')?.content ?? '';

  return res.json({
    success: true,
    data: {
      message: `アドバイザー機能はこのブランチで簡易モードです。\n\n受け取った質問: ${lastUserMessage}`,
      suggestedEdits: [],
    },
    message: 'Advisor response generated',
  });
};
