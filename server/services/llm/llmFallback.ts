import { LLMExtractionResult } from '../../models/types.js';
import { openaiClient } from '../openaiClient.js';
import { logger } from '../../utils/logger.js';

/**
 * スクレイピング欠損時のLLMフォールバック
 * 既存の抽出結果＋HTMLスニペットをLLMに渡し、欠損フィールドを補完する
 * LLM_FALLBACK=1 のときのみオーケストレータから呼ばれる
 */

/** 抽出モデル: gpt-4o-mini は抽出タスクで gpt-4o の ~80% 精度・1/10 コスト・~2x 速度。
 *  精度不足が見えたら環境変数 `LLM_EXTRACT_MODEL` で上書き可能。 */
const EXTRACT_MODEL = process.env.LLM_EXTRACT_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `あなたはアウトドアギアの製品情報抽出エキスパートです。
与えられた既存データとWebページのスニペットから、欠損しているフィールドを補完してください。

必ず以下のキーを持つ JSON オブジェクトのみを返してください（JSON 以外のテキストは一切含めない）。
確信がないフィールドは null にしてください:
{
  "name": string | null,
  "brand": string | null,
  "weightGrams": number | null,
  "priceCents": number | null,
  "suggestedCategory": "Shelter"|"Clothing"|"Cooking"|"Safety"|"Backpack"|"Sleep"|"Water"|"Electronics"|"Hygiene"|"Other"|null
}

重要:
- 既存データで既に値があるフィールドはそのまま返す
- 推測できないフィールドは null にする（でたらめは禁止）
- weightGrams は g 単位の数値のみ (例: 230)、kg や oz は g に換算
- priceCents は日本円なら円 × 100、ドルなら cent 単位`;

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
    logger.info('[LLM Fallback] OpenAI client not available, skipping');
    return null;
  }

  const userMessage = buildUserMessage(url, candidates, snippets);

  try {
    // JSON mode で呼び出し: response_format: { type: 'json_object' } が
    // 保証するため正規表現での切り出しは不要。パース失敗時は chatCompletionJson が throw する。
    const obj = await openaiClient.chatCompletionJson<Record<string, unknown>>(
      SYSTEM_PROMPT,
      userMessage,
      { model: EXTRACT_MODEL, maxTokens: 500 },
    );
    const parsed = validateFields(obj);
    if (!parsed) return null;

    return mergeWithCandidates(candidates, parsed);
  } catch (error) {
    logger.error({ err: error }, '[LLM Fallback] Failed:');
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

/** LLM レスポンス (既にパース済み object) を型ガードで検証する */
function validateFields(obj: Record<string, unknown>): LlmFallbackFields | null {
  const result: LlmFallbackFields = {};
  if (typeof obj.name === 'string' && obj.name.length > 0) result.name = obj.name;
  if (typeof obj.brand === 'string' && obj.brand.length > 0) result.brand = obj.brand;
  if (typeof obj.weightGrams === 'number' && obj.weightGrams > 0) result.weightGrams = obj.weightGrams;
  if (typeof obj.priceCents === 'number' && obj.priceCents > 0) result.priceCents = obj.priceCents;
  if (typeof obj.suggestedCategory === 'string') result.suggestedCategory = obj.suggestedCategory;

  return Object.keys(result).length > 0 ? result : null;
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
