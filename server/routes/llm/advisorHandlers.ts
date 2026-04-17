import { Request, Response } from 'express';
import { openaiClient } from '../../services/openaiClient.js';
import type {
  AdvisorMessage,
  AdvisorRequestBody,
  AdvisorResponseData,
  GearContext,
} from './advisorTypes.js';
import { ADVISOR_TOOLS, parseToolCalls } from './advisorTools.js';

// ==================== バリデーション ====================

const isAdvisorMessage = (value: unknown): value is AdvisorMessage => {
  if (!value || typeof value !== 'object') return false;
  const msg = value as { role?: unknown; content?: unknown };
  return (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string';
};

const isGearContext = (value: unknown): value is GearContext => {
  if (!value || typeof value !== 'object') return false;
  const ctx = value as { items?: unknown };
  return Array.isArray(ctx.items);
};

// ==================== システムプロンプト生成 ====================

const buildSystemPrompt = (ctx: GearContext): string => {
  const scope = ctx.packName
    ? `現在のスコープ: パック「${ctx.packName}」(${ctx.items.length}アイテム)`
    : `現在のスコープ: 全ギアリスト (${ctx.items.length}アイテム)`;

  const weightInfo = ctx.weightBreakdown
    ? [
        `ベースウェイト: ${ctx.weightBreakdown.baseWeight ?? 0}g (${((ctx.weightBreakdown.baseWeight ?? 0) / 1000).toFixed(2)}kg)`,
        `Big3合計: ${ctx.weightBreakdown.big3 ?? 0}g`,
        `UL分類: ${ctx.ulStatus?.classification ?? '不明'}`,
      ].join(' / ')
    : null;

  const gearLines = ctx.items.map((item) => {
    const parts = [`[ID:${item.id}] ${item.name}`];
    if (item.brand) parts.push(`(${item.brand})`);
    if (item.weightGrams != null) parts.push(`重量:${item.weightGrams}g`);
    if (item.priceCents != null) parts.push(`価格:¥${Math.round(item.priceCents / 100)}`);
    parts.push(`カテゴリ:${item.category?.name ?? '未分類'}`);
    parts.push(`class:${item.weightClass ?? 'base'}`);
    if (!item.isInKit) parts.push('(kit外)');
    return parts.join(' ');
  });

  return [
    'あなたはウルトラライト（UL）ハイキングの専門家アドバイザーです。',
    'ユーザーのギアリストを分析し、軽量化・コスト最適化・装備選択のアドバイスを日本語で提供します。',
    '',
    scope,
    weightInfo ?? '',
    '',
    '--- ギアリスト ---',
    ...gearLines,
    '--- ここまで ---',
    '',
    '## 回答ルール',
    '- 自然な文章でアドバイスを提供してください',
    '- ギアを具体的に言及する場合は reference_gear ツールを呼んでください（最大5件）',
    '- 重量・価格・キット状態・重量クラスの変更を提案する場合は suggest_edits ツールを呼んでください',
    '- ツール呼び出しは任意です。情報のみの返答ではツール呼び出し不要です',
  ]
    .filter((line) => line !== null)
    .join('\n');
};

// ==================== フォールバック応答 ====================

const buildFallbackResponse = (ctx: GearContext): AdvisorResponseData => {
  const totalItems = ctx.items.length;
  const baseWeightKg = ctx.weightBreakdown?.baseWeight
    ? (ctx.weightBreakdown.baseWeight / 1000).toFixed(2)
    : null;
  const scopeLabel = ctx.packName ? `pack "${ctx.packName}"` : 'your full gear list';

  const lines = [
    `Loaded ${scopeLabel} (${totalItems} items).`,
    baseWeightKg ? `Current base weight: ${baseWeightKg}kg.` : null,
    '',
    'The AI advisor is currently offline.',
    'Set OPENAI_API_KEY to enable full weight-saving analysis.',
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { message: lines, gearRefs: [], suggestedEdits: [] };
};

// ==================== バリデーションヘルパー（ストリーミングハンドラーと共有） ====================

export const validateAdvisorRequest = (
  body: AdvisorRequestBody,
): { conversation: AdvisorMessage[]; gearContext: GearContext } | { error: string } => {
  const { conversation, gearContext } = body;

  if (!Array.isArray(conversation) || conversation.length === 0) {
    return { error: 'conversation（非空配列）は必須です' };
  }
  if (!conversation.every(isAdvisorMessage)) {
    return { error: '各メッセージには role ("user"|"assistant") と content (string) が必要です' };
  }
  if (!isGearContext(gearContext)) {
    return { error: 'gearContext.items（配列）は必須です' };
  }

  return { conversation: conversation as AdvisorMessage[], gearContext: gearContext as GearContext };
};

// ==================== ハンドラー ====================

/**
 * POST /api/v1/llm/advisor
 * ギアアドバイザーとの多ターン会話
 */
export const handleAdvisorChat = async (req: Request, res: Response) => {
  const validated = validateAdvisorRequest(req.body as AdvisorRequestBody);
  if ('error' in validated) {
    return res.status(400).json({ success: false, message: validated.error });
  }

  const { conversation, gearContext } = validated;
  const usageContext = req.userId ? { userId: req.userId, endpoint: 'chat' as const } : undefined;

  // OpenAI 非利用時はフォールバック
  if (!openaiClient.isAvailable()) {
    console.info('[Advisor] OpenAI unavailable - returning fallback response');
    return res.json({
      success: true,
      data: buildFallbackResponse(gearContext),
      message: 'Fallback response (no API key)',
    });
  }

  try {
    const systemPrompt = buildSystemPrompt(gearContext);
    console.log(`[Advisor] Calling OpenAI with tools (${conversation.length} messages, ${gearContext.items.length} gear items)`);

    const completion = await openaiClient.chatWithTools(systemPrompt, conversation, ADVISOR_TOOLS, 1500, usageContext);
    const choice = completion.choices[0];
    const message = choice?.message?.content ?? '回答を生成できませんでした。';
    const { gearRefs, suggestedEdits } = parseToolCalls(choice?.message?.tool_calls);
    const data: AdvisorResponseData = { message, gearRefs, suggestedEdits };

    return res.json({ success: true, data, message: 'Advisor response generated' });
  } catch (error) {
    console.error('[Advisor] OpenAI call failed:', error);
    return res.json({
      success: true,
      data: {
        ...buildFallbackResponse(gearContext),
        message: `The AI request failed. Please try again in a moment.\n\n${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      message: 'Fallback response (API error)',
    });
  }
};

// ==================== SSE ストリーミングハンドラー ====================

/** SSE イベントを書き込むヘルパー */
const sendSSE = (res: Response, event: string, data: unknown) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

/**
 * POST /api/v1/llm/advisor/stream
 * SSE でトークンを逐次送信するストリーミング版アドバイザー
 */
export const handleAdvisorChatStream = async (req: Request, res: Response) => {
  const validated = validateAdvisorRequest(req.body as AdvisorRequestBody);
  if ('error' in validated) {
    return res.status(400).json({ success: false, message: validated.error });
  }

  const { conversation, gearContext } = validated;
  const usageContext = req.userId ? { userId: req.userId, endpoint: 'chat' as const } : undefined;

  // OpenAI 非利用時は通常JSONレスポンスにフォールバック（SSEヘッダーを書かない）
  if (!openaiClient.isAvailable()) {
    return res.json({
      success: true,
      data: buildFallbackResponse(gearContext),
      message: 'Fallback response (no API key)',
    });
  }

  // SSE ヘッダー設定
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let aborted = false;
  req.on('close', () => { aborted = true; });

  try {
    const systemPrompt = buildSystemPrompt(gearContext);
    console.log(`[Advisor/Stream] Calling OpenAI (${conversation.length} messages, ${gearContext.items.length} gear items)`);

    const stream = await openaiClient.chatWithToolsStream(systemPrompt, conversation, ADVISOR_TOOLS, 1500);

    // tool_calls の引数を手動蓄積
    const toolCallBuffers: Map<number, { name: string; arguments: string }> = new Map();
    let streamUsage: { prompt_tokens?: number; completion_tokens?: number } | null = null;

    for await (const chunk of stream) {
      if (aborted) break;

      // stream_options.include_usage=true により最終チャンクに usage が入る
      if (chunk.usage) {
        streamUsage = chunk.usage;
      }

      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      // テキストコンテンツ → token イベントで即送信
      if (delta.content) {
        sendSSE(res, 'token', { text: delta.content });
      }

      // tool_calls delta → バッファに蓄積
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const existing = toolCallBuffers.get(tc.index);
          if (existing) {
            existing.arguments += tc.function?.arguments ?? '';
          } else {
            toolCallBuffers.set(tc.index, {
              name: tc.function?.name ?? '',
              arguments: tc.function?.arguments ?? '',
            });
          }
        }
      }
    }

    if (aborted) {
      res.end();
      return;
    }

    // usage 記録は fire-and-forget（SSE レスポンスの完了を遅らせない）
    void openaiClient.trackStreamUsage(usageContext, streamUsage);

    // ストリーム完了: 蓄積したtool_callsをパースして送信
    if (toolCallBuffers.size > 0) {
      const toolCalls = Array.from(toolCallBuffers.values()).map((buf, i) => ({
        id: `call_${i}`,
        type: 'function' as const,
        function: { name: buf.name, arguments: buf.arguments },
      }));
      const { gearRefs, suggestedEdits } = parseToolCalls(toolCalls);

      if (gearRefs.length > 0) {
        sendSSE(res, 'tool', { name: 'reference_gear', data: gearRefs });
      }
      if (suggestedEdits.length > 0) {
        sendSSE(res, 'tool', { name: 'suggest_edits', data: suggestedEdits });
      }
    }

    sendSSE(res, 'done', {});
    res.end();
  } catch (error) {
    console.error('[Advisor/Stream] OpenAI call failed:', error);
    if (!res.headersSent) {
      // ヘッダー未送信ならJSONフォールバック
      return res.json({
        success: true,
        data: {
          ...buildFallbackResponse(gearContext),
          message: `The AI request failed. Please try again in a moment.\n\n${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        message: 'Fallback response (API error)',
      });
    }
    // SSE送信中のエラー
    sendSSE(res, 'error', { message: error instanceof Error ? error.message : 'Unknown error' });
    res.end();
  }
};
