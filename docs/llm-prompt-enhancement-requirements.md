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

## 2. 機能要件

### 2.1 プロンプト入力機能

#### 2.1.1 入力形式
- **テキスト入力**: 自然言語での指示
- **最大文字数**: 1,000文字
- **多言語対応**: 日本語・英語
- **例**:
  ```
  "テント カテゴリを追加して"
  "Arc'teryx Beta AR Jacket の情報を登録して"
  "現在のギアリストを分析して軽量化の提案をして"
  ```

#### 2.1.2 プロンプト分類システム
```typescript
type PromptCategory = 
  | 'category_management'  // カテゴリ管理
  | 'gear_extraction'      // ギア情報抽出
  | 'list_analysis'        // リスト分析
  | 'general_query'        // 一般的な質問
```
```

### 2.3 ギア情報抽出の改良

#### 2.3.1 プロンプトベース抽出
- **入力例**: "Patagonia Houdini Jacket サイズM の情報を登録"
- **抽出項目**:
  - 製品名（必須）
  - ブランド
  - サイズ・バリエーション
  - 重量・価格の推定
  - カテゴリの自動分類

#### 2.3.2 URL + プロンプト併用
- **複合入力**: URL + 追加情報
- **例**: "https://... + サイズLで実測230g"
- **処理**: URL抽出結果をプロンプト情報で補完・上書き



## 3. 技術仕様

### 3.1 プロンプト処理アーキテクチャ

#### 3.1.1 処理フロー
```
User Input → Prompt Classifier → Function Router → LLM Service → Result Formatter
```

#### 3.1.2 プロンプト分類器
```typescript
class PromptClassifier {
  classify(prompt: string): {
    category: PromptCategory
    confidence: number
    extractedEntities: Record<string, any>
  }
}
```

#### 3.1.3 関数ルーター
```typescript
class FunctionRouter {
  route(classification: Classification): Promise<LLMResult>
}
```

### 3.2 LLM サービス拡張

#### 3.2.1 新規エンドポイント
```
POST /api/v1/llm/process-prompt
POST /api/v1/llm/analyze-list
POST /api/v1/categories/suggest
```


### 3.3 データベース拡張

#### 3.3.1 新規テーブル
```sql
-- プロンプト履歴
CREATE TABLE prompt_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    prompt TEXT NOT NULL,
    classification VARCHAR(50),
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);


#### 3.3.2 既存テーブル拡張
```sql
-- GEAR_ITEMS テーブルに分析結果追加
ALTER TABLE gear_items ADD COLUMN analysis_notes JSONB;
ALTER TABLE gear_items ADD COLUMN alternatives JSONB;
```

### 3.4 UI/UX 拡張

#### 3.4.1 ChatPopup改修
- URL/プロンプト切り替えタブ
- 入力候補表示（類似プロンプト）
- 分析結果の可視化（チャート・テーブル）
- 提案の承認/却下インターフェース

#### 3.4.2 新規コンポーネント
```typescript
// 分析結果表示
<AnalysisResultDisplay result={analysisResult} />

// カテゴリ提案
<CategorySuggestionCard suggestion={categorySuggestion} />

// ギア代替品比較
<AlternativeComparison current={gear} alternatives={alternatives} />
```

## 4. API仕様

### 4.1 プロンプト処理
```typescript
POST /api/v1/llm/process-prompt
{
  "prompt": "テント カテゴリを追加して",
  "context": {
    "current_categories": ["Sleep", "Clothing"],
    "user_preferences": {}
  }
}

Response:
{
  "type": "category_creation",
  "result": {
    "suggested_category": {
      "name": "Shelter",
      "parent": "Sleep",
      "keywords": ["tent", "tarp", "bivy"]
    }
  },
  "confidence": 0.92
}
```

### 4.2 リスト分析
```typescript
POST /api/v1/llm/analyze-list/{list_id}
{
  "analysis_type": "weight_optimization",
  "focus_areas": ["base_weight", "alternatives"]
}

Response:
{
  "summary": "総重量12.5kg、Base Weight 8.2kg。5アイテムで1.2kg削減可能。",
  "recommendations": [
    {
      "type": "item_replacement",
      "current_item_id": "uuid",
      "alternatives": [
        {
          "name": "Zpacks Duplex",
          "weight_saving": 400,
          "price_difference": 50000
        }
      ]
    }
  ]
}
```

## 5. 疑問・提案事項

### 5.1 実装に関する疑問
1. **プロンプト処理の粒度**: 現在の提案では非常にシンプルですが、より柔軟な自然言語処理が必要でしょうか？
2. **分析機能の深度**: 簡易分析で十分か、より詳細な最適化提案が必要か？
3. **学習機能**: ユーザーの入力パターンを学習して提案精度を上げるべきか？

### 5.2 UX改善提案
1. **ワンクリック登録**: 頻出ブランド・製品の候補表示
2. **音声入力**: 「OK Google, Arc'teryx Beta AR を追加」
3. **バッチ処理**: 「今日買った3つのギアを登録」

### 5.3 技術的提案
1. **オフライン対応**: 基本的な推定機能はローカルで処理
2. **キャッシュ最適化**: 同じブランド・製品の推定結果をキャッシュ
3. **段階的LLM化**: 将来的にはOpenAI APIで高精度化

### 5.4 優先度の確認
- **最重要**: どの機能が最もユーザー体験を改善するか？
- **実装順序**: 3つの機能のうち、どれから始めるべきか？
- **完成度**: MVP版の完成ラインをどこに設定するか？

---

**Core Question**: この提案で「めんどくさいギア情報入力を省く」という目標は十分達成できそうでしょうか？他に重要な要素があれば教えてください。