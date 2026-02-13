# Weight Breakdown UI 仕様書

## 概要

データモデル仕様書に基づくUI拡張。会計軸（Base/Worn/Consumable）と派生集計（Weight Breakdown）を視覚化する。

---

## 1. テーブル列の追加

### 1.1 追加列

| 列名 | フィールド | 表示 | 幅 |
|------|-----------|------|-----|
| **Status** | `procurementStatus` (派生) | バッジ | 70px |
| **WtClass** | `weightClass` | アイコン+ラベル | 80px |

### 1.2 Status列の表示

派生値 `deriveStatus(requiredQuantity, ownedQuantity)` を表示。

| 値 | 色 | アイコン | 表示テキスト |
|----|-----|---------|-------------|
| `owned` | 緑 (`#10B981`) | ✓ | Owned |
| `partial` | 黄 (`#F59E0B`) | ◐ | Partial |
| `need` | 赤 (`#EF4444`) | ! | Need |

```tsx
// StatusBadge コンポーネント
const STATUS_CONFIG = {
  owned: { color: '#10B981', icon: '✓', label: 'Owned' },
  partial: { color: '#F59E0B', icon: '◐', label: 'Partial' },
  need: { color: '#EF4444', icon: '!', label: 'Need' }
};
```

### 1.3 WtClass列の表示

| 値 | アイコン | 色 | ツールチップ |
|----|---------|-----|-------------|
| `base` | 🎒 | グレー | 背負って運ぶ装備 |
| `worn` | 👕 | 青 | 身に着けて運ぶ |
| `consumable` | 🍽️ | オレンジ | 消費物（減る） |

```tsx
const WEIGHT_CLASS_CONFIG = {
  base: { icon: '🎒', color: '#6B7280', label: 'Base' },
  worn: { icon: '👕', color: '#3B82F6', label: 'Worn' },
  consumable: { icon: '🍽️', color: '#F97316', label: 'Cons' }
};
```

#### Big3マーカー（オプション）

Big3カテゴリのアイテムには、WtClassバッジの横に `Big3` マーカーを表示可能。

```tsx
// Big3カテゴリ判定
const BIG3_TAGS = ['big3_pack', 'big3_shelter', 'big3_sleep'];
const isBig3 = category?.tags?.some(t => BIG3_TAGS.includes(t));

// 表示例: [🎒 Base] [Big3]
```

**補足**：
- Big3の定義はカテゴリ由来（所与）
- WtClassは会計用途（独立）
- Big3カテゴリは自動的に`weight_class='base'`に矯正

### 1.4 列の並び順（推奨）

```
☑ | Image | Name | Cat | Qty | Status | WtClass | Wt(g) | Price | Pri | Season
```

- **Qty**: `owned/required` 形式で1列に統合
- **Status**: Qty の右隣に配置（数量から派生するため）
- **WtClass**: 重量の左に配置（重量の分類なので）

---

## 2. Weight Breakdown サマリーカード

### 2.1 レイアウト

```
┌─────────────────────────────────────────────────────────┐
│  WEIGHT BREAKDOWN                              [UL ⚡]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│  │  BASE   │  │  WORN   │  │  CONS   │                │
│  │ 3,850g  │  │  580g   │  │ 1,200g  │                │
│  │   🎒    │  │   👕    │  │   🍽️   │                │
│  └─────────┘  └─────────┘  └─────────┘                │
│                                                         │
│  ───────────────────────────────────────────────────   │
│                                                         │
│  Packed Weight    5,050g  (Base + Cons)                │
│  Skin-out Weight  5,630g  (Base + Worn + Cons)         │
│  Big3             2,100g  (カテゴリ定義: Pack+Shelter+Sleep) │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 UL ステータスバッジ

| 分類 | 条件 | 色 | 表示 |
|------|------|-----|------|
| Ultralight | Base < 4.5kg | 緑 | `⚡ UL` |
| Lightweight | 4.5kg ≤ Base < 9kg | 黄 | `LW` |
| Traditional | Base ≥ 9kg | グレー | `Trad` |

```tsx
const UL_STATUS_CONFIG = {
  ultralight: { label: '⚡ UL', color: '#10B981', bg: '#D1FAE5' },
  lightweight: { label: 'LW', color: '#F59E0B', bg: '#FEF3C7' },
  traditional: { label: 'Trad', color: '#6B7280', bg: '#F3F4F6' }
};
```

### 2.3 プログレスバー（オプション）

Base Weight の UL 閾値に対する進捗を表示。

```
Base Weight: 3,850g
[████████████░░░░░░░░] 85% of UL limit (4,500g)
```

### 2.4 Big3計算の注記

Big3はカテゴリの`tags`で定義され、`weight_class`とは独立。

```tsx
// Big3計算式（weight_class非依存）
const big3 = items
  .filter(item => item.isInKit && isBig3Category(item.category))
  .reduce((sum, item) => sum + (item.weightGrams || 0) * item.ownedQuantity, 0);
```

**表示文言**：
- `Big3 = Backpack + Shelter + Sleep（カテゴリ定義）`
- `※会計（Base/Worn/Cons）とは独立した集計`

---

## 3. GearChart との統合

### 3.1 チャートビューモード拡張

既存: `weight | cost`
追加: `weight-class`（会計区分別）

```tsx
type ChartViewMode = 'weight' | 'cost' | 'weight-class';
```

### 3.2 会計区分別チャート

`weight-class` モード時、カテゴリではなく会計区分でグループ化。

```
┌──────────────────────┐
│      ○ ○ ○           │  ← 3セグメント: Base/Worn/Cons
│        ●━━●          │
│      5,630g          │
│   SKIN-OUT WEIGHT    │
│   ⚡ Ultralight      │
└──────────────────────┘
```

色:
- Base: `#6B7280` (グレー)
- Worn: `#3B82F6` (青)
- Consumable: `#F97316` (オレンジ)

---

## 4. フィルタリング拡張

### 4.1 Status フィルタ

```tsx
type StatusFilter = 'all' | 'owned' | 'partial' | 'need';
```

UI: トグルボタングループ
```
[ All ] [ Owned ] [ Partial ] [ Need ]
```

### 4.2 WtClass フィルタ

```tsx
type WtClassFilter = 'all' | 'base' | 'worn' | 'consumable';
```

UI: トグルボタングループ
```
[ All ] [ 🎒 Base ] [ 👕 Worn ] [ 🍽️ Cons ]
```

### 4.3 isInKit フィルタ

```tsx
type KitFilter = 'all' | 'in-kit' | 'excluded';
```

UI: トグルボタン
```
[ Kit Only ] [ Show All ]
```

---

## 5. 編集フォーム拡張

### 5.1 WtClass セレクト

```tsx
<select name="weightClass" disabled={isBig3Category}>
  <option value="base">🎒 Base - 背負って運ぶ</option>
  <option value="worn">👕 Worn - 身に着けて運ぶ</option>
  <option value="consumable">🍽️ Consumable - 消費物</option>
</select>
{isBig3Category && (
  <p className="text-sm text-gray-500">
    Big3カテゴリのため会計はBaseに固定されます
  </p>
)}
```

#### Big3カテゴリ時の挙動

| 状態 | WtClass | 編集可否 | 説明 |
|------|---------|---------|------|
| Big3カテゴリ選択中 | `base`（固定） | 不可 | 自動矯正 |
| 非Big3カテゴリ | 任意 | 可 | ユーザー選択 |

```tsx
// カテゴリ変更時の自動矯正
useEffect(() => {
  if (isBig3Category(selectedCategory)) {
    setWeightClass('base');
  }
}, [selectedCategory]);
```

### 5.2 isInKit チェックボックス

```tsx
<label>
  <input type="checkbox" name="isInKit" defaultChecked />
  キットに含める（集計対象）
</label>
```

### 5.3 Weight Confidence 表示（読み取り専用）

LLM抽出時のみ表示。

```
Weight: 450g
└ Confidence: High (Source: jsonld)
```

---

## 6. コンポーネント構成

### 6.1 新規コンポーネント

| コンポーネント | 場所 | 説明 |
|---------------|------|------|
| `StatusBadge` | `components/ui/` | Status表示バッジ |
| `WeightClassBadge` | `components/ui/` | WtClass表示バッジ |
| `WeightBreakdownCard` | `components/` | 集計サマリーカード |
| `ULStatusBadge` | `components/ui/` | UL分類バッジ |
| `WeightClassFilter` | `components/filters/` | フィルタUI |

### 6.2 既存コンポーネント修正

| コンポーネント | 修正内容 |
|---------------|----------|
| `GearTable/TableHeader` | Status/WtClass 列追加 |
| `GearTable/TableRow` | Status/WtClass 表示追加 |
| `GearForm` | WtClass/isInKit フィールド追加 |
| `CompactSummary` | WeightBreakdown 統合 |
| `GearChart` | weight-class モード追加 |

---

## 7. 実装優先度

### Phase 1（MVP）
1. [ ] `StatusBadge` コンポーネント
2. [ ] `WeightClassBadge` コンポーネント
3. [ ] テーブル列追加（Status/WtClass）
4. [ ] `GearForm` にWtClass/isInKit追加

### Phase 2
5. [ ] `WeightBreakdownCard` コンポーネント
6. [ ] `ULStatusBadge` コンポーネント
7. [ ] フィルタリング拡張

### Phase 3
8. [ ] GearChart weight-class モード
9. [ ] プログレスバー（UL閾値）

---

## 8. デザイントークン追加

```typescript
// designSystem.ts に追加

export const STATUS_COLORS = {
  owned: '#10B981',
  partial: '#F59E0B',
  need: '#EF4444',
} as const;

export const WEIGHT_CLASS_COLORS = {
  base: '#6B7280',
  worn: '#3B82F6',
  consumable: '#F97316',
} as const;

export const UL_COLORS = {
  ultralight: { text: '#10B981', bg: '#D1FAE5' },
  lightweight: { text: '#F59E0B', bg: '#FEF3C7' },
  traditional: { text: '#6B7280', bg: '#F3F4F6' },
} as const;
```

---

## 9. API連携

### 9.1 Weight Breakdown 取得

```typescript
// GearService.getWeightBreakdown() を使用
const { breakdown, ulStatus } = await GearService.getWeightBreakdown();

// breakdown: WeightBreakdown
// ulStatus: { classification, baseWeight, threshold }
```

### 9.2 リアルタイム更新

Weight Breakdown は以下のタイミングで再取得:
- ギアアイテム作成/更新/削除時
- weightClass 変更時
- isInKit 変更時

---

作成日: 2026-02-01
更新日: 2026-02-01（Big3定義の安定化）
