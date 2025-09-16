/**
 * LLM Prompts - 最小限構成
 */
export const PROMPTS = {
  EXTRACT_GEAR: `以下のJSON形式でギア情報を抽出してください：
{
  "name": "製品名",
  "brand": "ブランド名またはnull",
  "weightGrams": "重量(グラム)またはnull",
  "priceCents": "価格(セント)またはnull", 
  "suggestedCategory": "Shelter|Clothing|Cooking|Safety|Other",
  "confidence": "0.0から1.0の信頼度"
}`,

  EXTRACT_URL: `以下のJSON形式でWeb情報を抽出してください：
{
  "name": "製品名",
  "brand": "ブランド名",
  "weightGrams": "重量推測値",
  "priceCents": "価格推測値",
  "suggestedCategory": "カテゴリ",
  "confidence": "信頼度(0.0-1.0)"
}`,

  EXTRACT_CATEGORY: `以下のJSON形式でカテゴリを抽出してください：
{
  "name": "日本語カテゴリ名",
  "englishName": "英語カテゴリ名"
}
分類: Shelter,Clothing,Cooking,Safety,Other`,

};