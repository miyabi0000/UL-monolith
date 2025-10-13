# LLM機能拡張 MVP要件定義書

## 1. MVP概要

### 1.1 目的
**「めんどくさいギア情報入力を省く」** の最小限価値提供を実現する。

ChatPopupの既存機能を拡張し、3つの基本操作をプロンプトで可能にする。

### 1.2 Phase 1 MVP機能（3つのみ）
1. **基本ギア登録**: 「ブランド名 製品名 を追加」
2. **URL登録**: 既存URL抽出 + プロンプト情報の上書き
3. **カテゴリ追加**: 「○○ カテゴリ追加」

### 1.3 MVP成功基準
- 手動入力時間を50%短縮
- プロンプト→ギア登録の成功率80%以上
- 追加開発工数2週間以内

## 2. MVP機能詳細

### 2.1 機能1: 基本ギア登録

#### 2.1.1 入力パターン
```
"Arc'teryx Beta AR 追加"
"Patagonia Houdini 登録" 
"MSR PocketRocket を追加"
```

#### 2.1.2 処理フロー
1. **ブランド・製品名抽出**: 既存BRAND_PATTERNSでブランド特定
2. **情報推定**: 既存estimateWeight/estimatePrice/suggestCategory関数活用
3. **確認画面表示**: ユーザーが修正可能な状態で登録確認
4. **ギアリスト追加**: 確認後に既存のonGearExtracted経由で追加

#### 2.1.3 エラーハンドリング
- ブランド不明: 「ブランドを特定できませんでした」→ 手動入力促進
- 製品名あいまい: 推定値を低信頼度で提示→ 修正を推奨

### 2.2 機能2: URL + プロンプト併用登録

#### 2.2.1 入力パターン
```
"https://montbell.jp/products/... サイズM 実測230g"
"https://amazon.co.jp/... + 中古品 15000円で購入"
```

#### 2.2.2 処理フロー
1. **URL処理**: 既存extractFromUrl関数で基本情報抽出
2. **プロンプト解析**: 重量・価格・サイズなどの上書き情報を抽出
3. **情報マージ**: URL抽出結果をプロンプト情報で上書き
4. **確認・登録**: 統合された情報で確認画面表示

### 2.3 機能3: シンプルカテゴリ追加

#### 2.3.1 入力パターン
```
"シェルター カテゴリ追加"
"調理器具 追加"
"Safety カテゴリ"
```

#### 2.3.2 処理フロー
1. **カテゴリ名抽出**: 「カテゴリ」「追加」キーワードを除去
2. **英語名変換**: 既存CATEGORY_KEYWORDSマッピングで正規化
3. **重複チェック**: 既存カテゴリとの照合
4. **カテゴリ作成**: データベースに新規カテゴリ追加

## 3. 技術実装（MVP版）

### 3.1 既存システム拡張のみ

#### 3.1.1 ChatPopup.tsx 修正
```typescript
const handleSend = async () => {
  const input = inputMessage.trim()
  
  // 既存URL処理
  if (isUrl(input)) {
    return handleUrl(input)
  }
  
  // 新規: プロンプト処理
  const promptType = classifyPrompt(input)
  switch (promptType) {
    case 'add_gear': return handleAddGear(input)
    case 'add_category': return handleAddCategory(input)
    case 'url_with_prompt': return handleUrlWithPrompt(input)
    default: return handleGeneral(input)
  }
}

// 超シンプルな分類
function classifyPrompt(prompt: string): PromptType {
  if (prompt.includes('http') && prompt.length > 50) return 'url_with_prompt'
  if (prompt.includes('カテゴリ') || prompt.includes('追加')) return 'add_category'
  if (containsBrand(prompt)) return 'add_gear'
  return 'general'
}
```

#### 3.1.2 llmExtraction.ts 拡張
```typescript
// プロンプトからギア情報抽出
export function extractFromPrompt(prompt: string): LLMExtractionResult {
  const brand = extractBrandFromPrompt(prompt)
  const productName = extractProductNameFromPrompt(prompt)
  
  if (!brand || !productName) {
    throw new Error('ブランド名・製品名を特定できませんでした')
  }
  
  return {
    name: productName,
    brand: brand,
    weightGrams: estimateWeight(productName, 'Other', ''),
    priceCents: estimatePrice(productName, 'Other', ''),
    suggestedCategory: suggestCategory(productName, ''),
    confidence: 0.6 // プロンプトベースは控えめ
  }
}

// URL+プロンプト併用
export function enhanceUrlDataWithPrompt(
  urlData: LLMExtractionResult, 
  prompt: string
): LLMExtractionResult {
  const enhanced = { ...urlData }
  
  // 重量の上書き
  const weightMatch = prompt.match(/(\d+)\s*g/)
  if (weightMatch) {
    enhanced.weightGrams = parseInt(weightMatch[1])
    enhanced.confidence = Math.min(0.95, enhanced.confidence + 0.2)
  }
  
  // 価格の上書き
  const priceMatch = prompt.match(/(\d+)\s*円/)
  if (priceMatch) {
    enhanced.priceCents = parseInt(priceMatch[1]) * 100
    enhanced.confidence = Math.min(0.95, enhanced.confidence + 0.2)
  }
  
  return enhanced
}
```

### 3.2 UI変更（最小限）

#### 3.2.1 プレースホルダー更新
```typescript
placeholder="商品URL または 簡単な指示を入力..."
```

#### 3.2.2 入力例ヒント追加
```tsx
<p className="text-xs text-gray-500 mt-1">
  例: "Arc'teryx Beta AR 追加" "シェルター カテゴリ追加" "URL + 実測230g"
</p>
```

## 4. 開発計画

### 4.1 Week 1: コア機能実装
- [ ] ChatPopup.tsxにプロンプト分類追加
- [ ] llmExtraction.tsに抽出関数追加
- [ ] 基本ギア登録機能完成
- [ ] カテゴリ追加機能完成

### 4.2 Week 2: 統合・テスト
- [ ] URL+プロンプト併用機能
- [ ] エラーハンドリング強化
- [ ] ユーザビリティテスト
- [ ] MVP完成

## 5. MVPの制約・割り切り

### 5.1 対象外機能
- **分析機能**: 将来のPhase 2で実装
- **複雑な自然言語処理**: シンプルなキーワードマッチのみ
- **学習機能**: ユーザー行動学習は後回し
- **高精度推定**: 推定精度より入力の簡単さ重視

### 5.2 品質基準の割り切り
- **推定精度**: 70%程度でも修正可能なら許容
- **エラーハンドリング**: 基本的なもののみ
- **パフォーマンス**: フロントエンド処理で十分高速

### 5.3 成功指標
1. **利用率**: ChatPopup利用者の80%がプロンプト機能を使用
2. **効率**: ギア登録時間が従来の50%に短縮
3. **満足度**: 「入力が楽になった」と感じるユーザーが80%以上

---

**このMVP版で「めんどくさいギア情報入力を省く」という核心価値を最小工数で実現し、ユーザーフィードバックを得てから次のPhaseに進む戦略です。**