/**
 * OpenAI Function Calling 用ツール定義 + パーサー
 * アドバイザーが gearRefs / suggestedEdits を返す際に使用
 */
import type { ChatCompletionTool, ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
import type { GearRef, SuggestedEdit } from './advisorTypes.js';
import { logger } from '../../utils/logger.js';

// ==================== ツール定義 ====================

export const ADVISOR_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'reference_gear',
      description: 'メッセージで具体的に言及したギアを参照する。1回の呼び出しで全参照をまとめて渡す。',
      parameters: {
        type: 'object',
        properties: {
          refs: {
            type: 'array',
            description: '参照するギア（最大5件）',
            items: {
              type: 'object',
              properties: {
                gearId: { type: 'string', description: 'ギアリストのID' },
                gearName: { type: 'string', description: 'ギア名' },
              },
              required: ['gearId', 'gearName'],
            },
            maxItems: 5,
          },
        },
        required: ['refs'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_edits',
      description: 'ギアの重量・価格・キット状態・重量クラスの変更を提案する。1回の呼び出しで全提案をまとめて渡す。',
      parameters: {
        type: 'object',
        properties: {
          edits: {
            type: 'array',
            description: '提案する編集リスト',
            items: {
              type: 'object',
              properties: {
                gearId: { type: 'string', description: 'ギアID' },
                gearName: { type: 'string', description: 'ギア名' },
                field: {
                  type: 'string',
                  enum: ['weightGrams', 'priceCents', 'isInKit', 'weightClass'],
                  description: '編集対象フィールド',
                },
                currentValue: { description: '現在の値' },
                suggestedValue: { description: '提案する新しい値' },
                reason: { type: 'string', description: '変更の理由' },
              },
              required: ['gearId', 'gearName', 'field', 'currentValue', 'suggestedValue', 'reason'],
            },
          },
        },
        required: ['edits'],
      },
    },
  },
];

// ==================== ツール呼び出しパーサー ====================

/**
 * OpenAI の tool_calls 配列から gearRefs / suggestedEdits を抽出
 */
export function parseToolCalls(
  toolCalls: ChatCompletionMessageToolCall[] | undefined,
): { gearRefs: GearRef[]; suggestedEdits: SuggestedEdit[] } {
  const gearRefs: GearRef[] = [];
  const suggestedEdits: SuggestedEdit[] = [];

  if (!toolCalls) return { gearRefs, suggestedEdits };

  for (const call of toolCalls) {
    if (call.type !== 'function') continue;

    let args: unknown;
    try {
      args = JSON.parse(call.function.arguments);
    } catch {
      logger.warn({ args: call.function.arguments }, `[AdvisorTools] JSON parse failed for ${call.function.name}`);
      continue;
    }

    if (call.function.name === 'reference_gear') {
      const obj = args as { refs?: unknown[] };
      if (Array.isArray(obj.refs)) {
        for (const ref of obj.refs) {
          if (
            ref && typeof ref === 'object' &&
            typeof (ref as GearRef).gearId === 'string' &&
            typeof (ref as GearRef).gearName === 'string'
          ) {
            gearRefs.push({ gearId: (ref as GearRef).gearId, gearName: (ref as GearRef).gearName });
          }
        }
      }
    } else if (call.function.name === 'suggest_edits') {
      const obj = args as { edits?: unknown[] };
      if (Array.isArray(obj.edits)) {
        for (const edit of obj.edits) {
          if (
            edit && typeof edit === 'object' &&
            typeof (edit as SuggestedEdit).gearId === 'string' &&
            typeof (edit as SuggestedEdit).gearName === 'string' &&
            typeof (edit as SuggestedEdit).field === 'string' &&
            typeof (edit as SuggestedEdit).reason === 'string'
          ) {
            suggestedEdits.push(edit as SuggestedEdit);
          }
        }
      }
    }
  }

  return { gearRefs, suggestedEdits };
}
