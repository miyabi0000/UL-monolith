/**
 * LLM Prompts - 最小限に簡略化
 */

export const PROMPTS = {
  EXTRACT_GEAR: `ギア情報をJSONで抽出:
{
  "name": "製品名",
  "brand": "ブランド名 or null",
  "weightGrams": 重量グラム or null,
  "priceCents": 価格セント or null,
  "suggestedCategory": "Shelter|Clothing|Cooking|Safety|Other",
  "confidence": 0.0-1.0
}`,

  EXTRACT_URL: `URL情報をJSONで推測:
{
  "name": "製品名",
  "brand": "ブランド名",
  "weightGrams": 重量推測,
  "priceCents": 価格推測,
  "suggestedCategory": "カテゴリ",
  "confidence": 0.0-1.0
}`,

  ENHANCE_PROMPT: `既存データを追加情報で更新:`,

  EXTRACT_CATEGORY: `カテゴリをJSONで抽出:
{
  "name": "日本語名",
  "englishName": "英語名"
}
分類: Shelter,Clothing,Cooking,Safety,Other`,

  ANALYZE_LIST: `ギアリスト分析をJSONで:
{
  "summary": "1-2文の分析",
  "tips": ["改善提案1", "改善提案2"]
}`
};

export const BRAND_PATTERNS = [
  'Arc\'teryx', 'Patagonia', 'Montbell', 'REI', 'Osprey', 
  'Deuter', 'MSR', 'Snow Peak', 'Coleman', 'NEMO', 'Big Agnes'
];

export const CATEGORY_MAP: Record<string, { name: string; englishName: string }> = {
  'テント': { name: 'シェルター', englishName: 'Shelter' },
  'シェルター': { name: 'シェルター', englishName: 'Shelter' },
  'ジャケット': { name: 'ウェア', englishName: 'Clothing' },
  'ウェア': { name: 'ウェア', englishName: 'Clothing' },
  '調理': { name: '調理器具', englishName: 'Cooking' },
  'バーナー': { name: '調理器具', englishName: 'Cooking' },
  '安全': { name: '安全装備', englishName: 'Safety' }
};