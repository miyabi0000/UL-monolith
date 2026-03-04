import { LLMExtractionResult } from '../../models/types.js';
import { openaiClient } from '../openaiClient.js';

/**
 * スクレイピング欠損時のLLMフォールバック
 * 既存の抽出結果＋HTMLスニペットをLLMに渡し、欠損フィールドを補完する
 * LLM_FALLBACK=1 のときのみオーケストレータから呼ばれる
 */

const SYSTEM_PROMPT = `あなたはアウトドアギアの製品情報抽出エキスパートです。
与えられた既存データとWebページのスニペットから、欠損しているフィールドを補完してください。

以下のJSON形式で返してください。確信がないフィールドはnullにしてください:
{
  "name": "製品名 (string | null)",
  "brand": "ブランド名 (string | null)",
  "weightGrams": "重量グラム (number | null)",
  "priceCents": "価格セント (number | null)",
  "suggestedCategory": "Shelter|Clothing|Cooking|Safety|Backpack|Sleep|Water|Electronics|Hygiene|Other (string | null)"
}

重要:
- 既存データで既に値があるフィールドはそのまま返す
- 推測できないフィールドはnullにする（でたらめは禁止）
- JSON以外のテキストは出力しない`;

interface LlmFallbackFields {
  name?: string | null;
  brand?: string | null;
  weightGrams?: number | null;
  priceCents?: number | null;
  suggestedCategory?: string | null;
}

/**
 * LLMで欠損フィールドを補完
 * 失敗時は null を返す（呼び出し側が従来結果をそのまま使う）
 */
export async function llmFallback(
  url: string,
  candidates: LLMExtractionResult,
  snippets: string,
): Promise<Partial<LLMExtractionResult> | null> {
  if (!openaiClient.isAvailable()) {
    console.log('[LLM Fallback] OpenAI client not available, skipping');
    return null;
  }

  const userMessage = buildUserMessage(url, candidates, snippets);

  try {
    const response = await openaiClient.chatCompletion(SYSTEM_PROMPT, userMessage);
    const parsed = parseAndValidate(response);
    if (!parsed) return null;

    return mergeWithCandidates(candidates, parsed);
  } catch (error) {
    console.error('[LLM Fallback] Failed:', error);
    return null;
  }
}

function buildUserMessage(url: string, candidates: LLMExtractionResult, snippets: string): string {
  const parts = [`URL: ${url}`];

  const existing: Record<string, unknown> = {};
  if (candidates.name && candidates.name !== 'Unknown Product') existing.name = candidates.name;
  if (candidates.brand) existing.brand = candidates.brand;
  if (candidates.weightGrams) existing.weightGrams = candidates.weightGrams;
  if (candidates.priceCents) existing.priceCents = candidates.priceCents;
  if (candidates.suggestedCategory && candidates.suggestedCategory !== 'Other') {
    existing.suggestedCategory = candidates.suggestedCategory;
  }

  if (Object.keys(existing).length > 0) {
    parts.push(`既存データ: ${JSON.stringify(existing)}`);
  }

  if (snippets) {
    parts.push(`ページスニペット:\n${snippets}`);
  }

  return parts.join('\n\n');
}

/** LLMレスポンスをパース＋簡易バリデーション */
function parseAndValidate(response: string): LlmFallbackFields | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const obj = JSON.parse(jsonMatch[0]);

    // 型チェック: 期待する型でなければ除外
    const result: LlmFallbackFields = {};
    if (typeof obj.name === 'string' && obj.name.length > 0) result.name = obj.name;
    if (typeof obj.brand === 'string' && obj.brand.length > 0) result.brand = obj.brand;
    if (typeof obj.weightGrams === 'number' && obj.weightGrams > 0) result.weightGrams = obj.weightGrams;
    if (typeof obj.priceCents === 'number' && obj.priceCents > 0) result.priceCents = obj.priceCents;
    if (typeof obj.suggestedCategory === 'string') result.suggestedCategory = obj.suggestedCategory;

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

/** 既存データを優先しつつ欠損フィールドだけLLM結果で埋める */
function mergeWithCandidates(
  candidates: LLMExtractionResult,
  llm: LlmFallbackFields,
): Partial<LLMExtractionResult> {
  const merged: Partial<LLMExtractionResult> = {};

  if (!candidates.name || candidates.name === 'Unknown Product') {
    merged.name = llm.name ?? undefined;
  }
  if (!candidates.brand) merged.brand = llm.brand ?? undefined;
  if (!candidates.weightGrams) merged.weightGrams = llm.weightGrams ?? undefined;
  if (!candidates.priceCents) merged.priceCents = llm.priceCents ?? undefined;
  if (!candidates.suggestedCategory || candidates.suggestedCategory === 'Other') {
    merged.suggestedCategory = llm.suggestedCategory ?? undefined;
  }

  return merged;
}
