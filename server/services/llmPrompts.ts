/**
 * LLM Prompts - 固定版（MVPに最適化）
 */
export const PROMPTS = {
  EXTRACT_GEAR: `アウトドアギア情報をJSON形式で抽出してください：

{
  "name": "製品名",
  "brand": "ブランド名またはnull",
  "weightGrams": 重量グラムまたはnull,
  "priceCents": 価格セントまたはnull,
  "suggestedCategory": "Shelter|Clothing|Cooking|Safety|Backpack|Other"
}`,

  ENHANCE_PROMPT: `既存データを追加情報で補完してください。既存データを優先し、同じJSON形式で返してください。`,

  EXTRACT_CATEGORY: `カテゴリをJSON形式で抽出してください：
{
  "name": "日本語カテゴリ名",
  "englishName": "英語カテゴリ名"
}
分類: Shelter,Clothing,Cooking,Safety,Backpack,Other`
};