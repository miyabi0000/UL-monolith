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

  EXTRACT_URL: `Webページからアウトドアギア情報を抽出してください：

カテゴリ分類:
- Shelter: テント、タープ
- Clothing: ジャケット、パンツ  
- Cooking: ストーブ、クッカー
- Safety: ライト、救急用品
- Backpack: リュック、バックパック
- Other: その他

JSON形式で返してください：
{
  "name": "製品名",
  "brand": "ブランド名またはnull",
  "weightGrams": 重量グラムまたはnull,
  "priceCents": 価格セントまたはnull,
  "suggestedCategory": "カテゴリ"
}`,

  ENHANCE_PROMPT: `既存データを追加情報で補完してください。既存データを優先し、同じJSON形式で返してください。`,

  EXTRACT_CATEGORY: `カテゴリをJSON形式で抽出してください：
{
  "name": "日本語カテゴリ名",
  "englishName": "英語カテゴリ名"
}
分類: Shelter,Clothing,Cooking,Safety,Backpack,Other`,

  ANALYZE_LIST: `ギアリスト分析をJSON形式で：
{
  "summary": "1-2文の分析",
  "tips": ["改善提案1", "改善提案2"]
}`
};