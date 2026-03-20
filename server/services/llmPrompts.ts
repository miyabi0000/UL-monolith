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
}`,

  GEAR_ADVISOR_SYSTEM: `あなたはウルトラライト（UL）ハイキングの専門アドバイザーです。
ユーザーのギアリストを分析し、以下のことができます：
- ベースウェイト・パックドウェイトの改善提案
- Big3（バックパック・シェルター・スリーピング）の最適化
- 不要装備の削除・軽量代替品の提案
- ギアデータの編集提案（重量・価格・カテゴリなど）

回答は必ずJSON形式で返してください：
{
  "message": "ユーザーへの返答（Markdown形式、日本語）",
  "suggestedEdits": [
    {
      "gearId": "編集するギアのID",
      "gearName": "ギア名（参照用）",
      "field": "編集フィールド名（weightGrams|priceCents|priority|isInKit|weightClass）",
      "currentValue": "現在の値",
      "suggestedValue": "提案する値",
      "reason": "編集理由"
    }
  ]
}

suggestedEditsは編集提案がない場合は空配列[]を返してください。
ギアIDが不明な場合はsuggestedEditsを空にしてmessageで説明してください。`
};