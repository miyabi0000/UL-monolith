import { Request, Response } from 'express';
import { openaiClient } from '../../services/openaiClient.js';

// ==================== 型定義 ====================

type AdvisorRole = 'user' | 'assistant';

interface AdvisorMessage {
  role: AdvisorRole;
  content: string;
}

interface GearItem {
  id: string;
  name: string;
  brand?: string;
  weightGrams?: number;
  priceCents?: number;
  weightClass?: string;
  isInKit?: boolean;
  category?: { name: string } | null;
}

interface WeightBreakdown {
  baseWeight?: number;
  big3?: number;
}

interface ULStatus {
  classification?: string;
}

interface GearContext {
  items: GearItem[];
  weightBreakdown?: WeightBreakdown | null;
  ulStatus?: ULStatus | null;
  packName?: string | null;
}

interface AdvisorRequestBody {
  conversation?: unknown;
  gearContext?: unknown;
}

interface SuggestedEdit {
  gearId: string;
  gearName: string;
  field: string;
  currentValue: unknown;
  suggestedValue: unknown;
  reason: string;
}

interface GearRef {
  gearId: string;
  gearName: string;
}

interface AdvisorResponseData {
  message: string;
  gearRefs: GearRef[];
  suggestedEdits: SuggestedEdit[];
}

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
    '## 回答フォーマット',
    '必ず以下のJSONのみを返してください（コードブロック不要）:',
    '{',
    '  "message": "アドバイスのメッセージ（改行は\\nで表現）",',
    '  "gearRefs": [{ "gearId": "IDをそのまま", "gearName": "ギア名" }],',
    '  "suggestedEdits": [',
    '    { "gearId": "ID", "gearName": "名前", "field": "weightGrams|priceCents|isInKit|weightClass", "currentValue": 現在値, "suggestedValue": 提案値, "reason": "理由" }',
    '  ]',
    '}',
    '',
    'gearRefs: メッセージで具体的に言及したギアのID/名前（最大5件、不要なら空配列）',
    'suggestedEdits: 実際に数値・状態の変更を提案する場合のみ含める（不要なら空配列）',
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

// ==================== JSONパース ====================

const parseAdvisorResponse = (raw: string): AdvisorResponseData => {
  // JSONコードブロックを除去してからパース
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // JSON抽出を試みる
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON not found in response');
    parsed = JSON.parse(match[0]);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid response structure');
  }

  const obj = parsed as Record<string, unknown>;

  return {
    message: typeof obj.message === 'string' ? obj.message : '回答を生成できませんでした。',
    gearRefs: Array.isArray(obj.gearRefs)
      ? obj.gearRefs.filter(
          (r): r is GearRef =>
            r != null && typeof r === 'object' &&
            typeof (r as GearRef).gearId === 'string' &&
            typeof (r as GearRef).gearName === 'string'
        )
      : [],
    suggestedEdits: Array.isArray(obj.suggestedEdits)
      ? obj.suggestedEdits.filter(
          (e): e is SuggestedEdit =>
            e != null && typeof e === 'object' &&
            typeof (e as SuggestedEdit).gearId === 'string'
        )
      : [],
  };
};

// ==================== ハンドラー ====================

/**
 * POST /api/v1/llm/advisor
 * ギアアドバイザーとの多ターン会話
 */
export const handleAdvisorChat = async (req: Request, res: Response) => {
  const { conversation, gearContext } = req.body as AdvisorRequestBody;

  // バリデーション
  if (!Array.isArray(conversation) || conversation.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'conversation（非空配列）は必須です',
    });
  }

  if (!conversation.every(isAdvisorMessage)) {
    return res.status(400).json({
      success: false,
      message: '各メッセージには role ("user"|"assistant") と content (string) が必要です',
    });
  }

  if (!isGearContext(gearContext)) {
    return res.status(400).json({
      success: false,
      message: 'gearContext.items（配列）は必須です',
    });
  }

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
    console.log(`[Advisor] Calling OpenAI (${conversation.length} messages, ${gearContext.items.length} gear items)`);

    const raw = await openaiClient.chatWithHistory(systemPrompt, conversation, 1500);
    const data = parseAdvisorResponse(raw);

    return res.json({ success: true, data, message: 'Advisor response generated' });
  } catch (error) {
    console.error('[Advisor] OpenAI call failed:', error);
    // API呼び出し失敗時もフォールバックを返す（500にせずUXを維持）
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
