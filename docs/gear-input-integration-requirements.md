# ギア入力体験統合 - 要件定義書

## 概要
複数URL一括入力から個別確認・保存までの一貫したギア追加フローを実装し、ユーザー体験を向上させる。

---

## 目標
- **シンプルな入力**: +ADDボタン → リンク入力 → Extractボタン
- **一括処理**: 複数URLを同時に分析
- **個別確認**: 抽出された各ギアを1件ずつ確認・編集
- **必須項目チェック**: AI/ユーザーが未入力の項目を視覚的に表示

---

## 既存実装の活用

### 1. AI抽出機能（ChatPopup.tsx）
- **複数URL処理**: `extractMultipleUrls()` - URLを抽出・重複排除
- **並列処理**: `Promise.allSettled()` - 全URLを同時処理
- **成功/失敗判定**: フォールバック検知ロジックあり
- **活用方法**: ChatPopupのロジックをそのまま新しいフローに移植

### 2. 単体ギア入力（GearForm.tsx）
- **URL抽出**: `handleExtractFromUrl()` - 1件のURL処理
- **フォーム管理**: `useState<GearItemForm>` - ギアデータの状態管理
- **画像アップロード**: `useImageUpload` - ドラッグ&ドロップ対応
- **活用方法**: 既存のGearFormを「n分のn」モード対応に拡張

### 3. バックエンドAPI
- **エンドポイント**: `/api/v1/llm/extract-url`
- **カテゴリマッチング**: CategoryMatcher - サーバー側で自動マッチング
- **エラーハンドリング**: バリデーション + フォールバック
- **活用方法**: 既存APIをそのまま使用（変更不要）

---

## 新規実装フロー

### Phase 1: リンク入力画面
**場所**: ホームページの+ADDボタン → 新しいモーダル（BulkUrlInputModal.tsx）

#### UI構成
```
┌────────────────────────────────────────┐
│  Add Gear from URLs                    │
├────────────────────────────────────────┤
│  Paste product URLs (one per line)     │
│  ┌──────────────────────────────────┐  │
│  │ https://example.com/product-1    │  │
│  │ https://example.com/product-2    │  │
│  │ https://example.com/product-3    │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [Cancel]              [Extract (3)]  │
└────────────────────────────────────────┘
```

#### 機能
- **入力形式**: 改行区切りのURL（ChatPopupの`extractMultipleUrls`を使用）
- **リアルタイム検出**: URL数をボタンに表示（例: Extract (3)）
- **バリデーション**: 1件以上のURLが必要

#### 実装詳細
```typescript
const BulkUrlInputModal: React.FC = () => {
  const [urlText, setUrlText] = useState('')
  const urls = extractMultipleUrls(urlText) // ChatPopupから移植

  return (
    <Modal>
      <textarea value={urlText} onChange={...} />
      <button disabled={urls.length === 0}>
        Extract ({urls.length})
      </button>
    </Modal>
  )
}
```

---

### Phase 2: 一括抽出処理
**処理タイミング**: Extractボタンクリック時

#### 処理フロー
1. **URL配列作成**: `extractMultipleUrls(urlText)`
2. **並列API呼び出し**: `Promise.allSettled(urls.map(url => extractFromUrl(url, categories)))`
3. **成功/失敗分類**: ChatPopupの判定ロジックを使用
   ```typescript
   const isFallback =
     data.source === 'fallback' ||
     data.confidence < 0.5 ||
     !data.name ||
     data.name.includes('Failed to Extract')
   ```
4. **結果を保存**: 成功したギアデータを状態管理
5. **進捗表示**:
   - ローディング中: "3件のリンクを分析中..."（通知ポップアップ）
   - 完了: "2件のギアを抽出しました。1件失敗"

#### 実装詳細
```typescript
const handleExtract = async () => {
  const loadingId = showLoading(`${urls.length}件のリンクを分析中...`)

  const results = await Promise.allSettled(
    urls.map(url => extractFromUrl(url, categories))
  )

  const successResults = results.filter(/* 成功判定 */)
  const failedUrls = results.filter(/* 失敗判定 */)

  setExtractedGears(successResults.map(r => ({
    ...r.value,
    url: r.url,
    // 未入力フィールドを明示的にundefinedで保持
  })))

  removeNotification(loadingId)
  showSuccess(`${successResults.length}件のギアを抽出しました`)

  // Phase 3へ遷移
  setCurrentStep('confirm')
}
```

---

### Phase 3: n分のn確認画面
**場所**: 既存のGearFormを拡張（モーダル形式）

#### UI構成
```
┌──────────────────────────────────────────┐
│  Review Gear (1 of 3)                    │
├──────────────────────────────────────────┤
│  [Product Image]                         │
│                                          │
│  Product Name: Arc'teryx Beta AR    ✓    │
│  Brand: Arc'teryx                   ✓    │
│  Weight (g): [____]                 ⚠️   │ ← 未入力（赤枠）
│  Price (¥): 50000                   ✓    │
│  Category: Clothing                 ✓    │
│  ...                                     │
│                                          │
│  [Skip]  [Previous]  [Save & Next (1/3)] │
└──────────────────────────────────────────┘
```

#### 必須フィールド定義
```typescript
const REQUIRED_FIELDS = ['name', 'categoryId']

// バリデーション
const validateGear = (gear: GearItemForm): string[] => {
  const missing = REQUIRED_FIELDS.filter(field => !gear[field])
  return missing
}
```

#### 未入力項目の表示ルール（AI判定）
**実装アプローチ**: AIが抽出できなかったフィールドを自動検知して赤く表示

```typescript
// AI抽出結果を分析
const analyzeExtractionQuality = (extractedGear: LLMExtractionResult) => {
  const emptyFields: string[] = []

  // 重要フィールドのチェック
  if (!extractedGear.name) emptyFields.push('name')
  if (!extractedGear.brand) emptyFields.push('brand')
  if (!extractedGear.weightGrams) emptyFields.push('weightGrams')
  if (!extractedGear.priceCents) emptyFields.push('priceCents')
  if (!extractedGear.suggestedCategory) emptyFields.push('categoryId')
  if (!extractedGear.imageUrl) emptyFields.push('imageUrl')

  return emptyFields
}

// フォームフィールドのスタイル適用
const getFieldClassName = (fieldName: string) => {
  const hasError = emptyFields.includes(fieldName)
  return `input ${hasError ? 'border-red-500 border-2' : ''}`
}
```

**視覚的フィードバック**:
- 未入力: `border-red-500 border-2`（赤い太枠）
- 入力済み: 通常の`input`スタイル
- ラベルに⚠️マークを追加（オプション）

#### ナビゲーション機能
- **Previous**: 前のギアに戻る（1件目では無効化）
- **Save & Next**:
  - 必須項目チェック
  - 保存成功後、次のギアへ
  - 最後のギア: "Save & Finish"
- **Skip**: 現在のギアをスキップ（保存せずに次へ）

#### 実装詳細
```typescript
const GearFormWithBulkSupport: React.FC = ({
  gears, // 抽出された全ギアデータ
  currentIndex,
  onSave,
  onNext,
  onPrevious,
  onSkip
}) => {
  const [form, setForm] = useState(gears[currentIndex])
  const emptyFields = analyzeExtractionQuality(gears[currentIndex])
  const missingRequired = validateGear(form)

  const handleSaveAndNext = async () => {
    if (missingRequired.length > 0) {
      showError('必須項目を入力してください')
      return
    }

    await onSave(form)
    onNext()
  }

  return (
    <Modal>
      <h2>Review Gear ({currentIndex + 1} of {gears.length})</h2>

      {/* 各フィールド */}
      <input
        className={getFieldClassName('name')}
        value={form.name}
        {...}
      />

      <div className="flex justify-between">
        <button onClick={onSkip}>Skip</button>
        <button onClick={onPrevious} disabled={currentIndex === 0}>
          Previous
        </button>
        <button onClick={handleSaveAndNext}>
          {currentIndex === gears.length - 1 ? 'Save & Finish' : 'Save & Next'}
        </button>
      </div>
    </Modal>
  )
}
```

---

### Phase 4: 完了
**処理**: 全ギアの保存が完了した時点

#### 完了時の動作
1. **通知表示**: "3件のギアを追加しました"（成功ポップアップ）
2. **データ更新**: `refreshGearItems()` でギアリストを再取得
3. **モーダルクローズ**: 入力フローを終了
4. **スキップ分の報告**: "2件保存、1件スキップ"

---

## 技術仕様

### コンポーネント構成
```
BulkGearInputFlow/
├── BulkUrlInputModal.tsx      // Phase 1: URL入力
├── GearExtractionProgress.tsx // Phase 2: 抽出処理（オプション）
└── GearFormBulk.tsx           // Phase 3: n分のn確認
```

### 状態管理
```typescript
// useAppState に追加
const [bulkGearFlow, setBulkGearFlow] = useState({
  step: 'input' | 'extracting' | 'confirm' | 'complete',
  urls: string[],
  extractedGears: LLMExtractionResult[],
  currentIndex: number,
  savedCount: number,
  skippedCount: number
})
```

### 既存GearFormとの統合
**オプション1**: GearFormを拡張
```typescript
interface GearFormProps {
  // 既存props
  gear?: GearItemWithCalculated
  editingGear?: GearItemWithCalculated

  // 新規props（バルク対応）
  bulkMode?: boolean
  bulkGears?: LLMExtractionResult[]
  currentBulkIndex?: number
  onBulkNext?: () => void
  onBulkPrevious?: () => void
  onBulkSkip?: () => void
}
```

**オプション2**: 新しいコンポーネント作成
- `GearFormBulk.tsx` - バルク専用フォーム
- 既存GearFormのロジックを再利用

**推奨**: オプション2（責務の分離）

---

## エラーハンドリング

### 抽出失敗時
- **全件失敗**: "URLから情報を抽出できませんでした"
- **一部失敗**: "2件成功、1件失敗しました。失敗したURL: ..."
- **失敗URLの再試行**: （今回は実装しない）

### 保存失敗時
- **個別保存失敗**: エラーポップアップ + 同じギアに留まる
- **ネットワークエラー**: リトライ可能なエラー通知

---

## 未入力項目の赤色表示ロジック

### AIによる自動判定
```typescript
// AI抽出結果から未入力を検出
const detectEmptyFields = (extracted: LLMExtractionResult): string[] => {
  const fields: string[] = []

  if (!extracted.name || extracted.name.includes('Unknown')) {
    fields.push('name')
  }
  if (!extracted.brand) fields.push('brand')
  if (!extracted.weightGrams) fields.push('weightGrams')
  if (!extracted.priceCents) fields.push('priceCents')
  if (!extracted.imageUrl) fields.push('imageUrl')
  if (!extracted.suggestedCategory) fields.push('categoryId')

  return fields
}
```

### 視覚フィードバック
- **Tailwind CSS**: `border-red-500 border-2 bg-red-50`
- **ラベル**: `<label className="text-red-600">Weight (g) ⚠️</label>`
- **ヘルプテキスト**: "この項目はAIが抽出できませんでした"

---

## UI/UXの改善点

### プログレスインジケーター
```
┌────────────────────────────────────┐
│ [●●●○○○○○○○○○] 3 / 12 件処理中 │
└────────────────────────────────────┘
```

### キーボードショートカット
- **Enter**: Save & Next
- **Shift + Enter**: Save & Finish
- **Ctrl + →**: Next（保存せず）
- **Ctrl + ←**: Previous

### 自動フォーカス
- モーダルが開いたら最初の未入力フィールドにフォーカス
- Save & Next後も次のギアの未入力フィールドにフォーカス

---

## 実装スケジュール

### Step 1: URL入力モーダル
- [ ] BulkUrlInputModal.tsx 作成
- [ ] extractMultipleUrls ロジック移植
- [ ] +ADDボタンからの呼び出し追加

### Step 2: 一括抽出処理
- [ ] 並列API呼び出し実装
- [ ] 成功/失敗分類ロジック
- [ ] プログレス通知

### Step 3: n分のn確認画面
- [ ] GearFormBulk.tsx 作成
- [ ] ナビゲーション機能（Previous/Next/Skip）
- [ ] 未入力項目の赤色表示
- [ ] 必須項目バリデーション

### Step 4: 統合テスト
- [ ] エンドツーエンドテスト
- [ ] エラーケーステスト
- [ ] UX改善

---

## 参考実装

### ChatPopup.tsx（複数URL処理）
- client/components/ChatPopup.tsx:240-324

### GearForm.tsx（単体ギア入力）
- client/components/GearForm.tsx:68-110（URL抽出）
- client/components/GearForm.tsx:112-125（保存処理）

### extractHandlers.ts（バックエンドAPI）
- server/routes/llm/extractHandlers.ts:8-62

---

## 備考
- 既存のChatPopupは削除せず、両方のフローを維持
- 将来的には統合を検討（ただし今回は別実装）
- 必須フィールドは将来的に設定可能にする（拡張性）
