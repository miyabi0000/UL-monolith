# GearChart インタラクション改善仕様

## 課題

現状、カテゴリを選択した状態では以下の問題がある：

1. **重量/金額の表示切り替えができない**
   - 中央円をクリックすると「戻る」動作になる
   - カテゴリ選択中にWeight/Costを切り替えたい場合、一度戻ってから切り替える必要がある
   - 操作が煩雑で不便

2. **「戻る」操作の発見性が低い**
   - 中央円をクリックで戻れることに気づきにくい
   - 他の操作方法がない

## 提案する改善案

### 中央円の役割を変更

**カテゴリ未選択時**:
```
┌─────────────────┐
│                 │
│   ●━━━━━●      │  ← 中央円
│   TOTAL WEIGHT  │     クリック → Weight/Cost切り替え
│                 │
└─────────────────┘
```

**カテゴリ選択時**:
```
┌─────────────────┐
│   ○○○○○○       │  ← 薄くなった内円（他カテゴリ）
│   ●━━━━━●      │     クリック → 選択解除（戻る）
│   Shelter       │
│   1,200g (45%)  │  ← 中央円（選択カテゴリ情報）
│                 │     クリック → Weight/Cost切り替え
└─────────────────┘
```

**ギア選択時**（NEW!）:
```
┌─────────────────┐
│   ○○○○○○       │  ← 薄くなった内円（他カテゴリ）
│   ●━━━━━●      │     クリック → カテゴリレベルに戻る
│   ●━━━━━●      │  ← 外円（選択カテゴリの各ギア）
│   Tent (Brand)  │     クリック → ギアレベルに戻る
│   670g (25%)    │  ← 中央円（選択ギア情報）
│                 │     クリック → Weight/Cost切り替え
└─────────────────┘
```

### 新しいインタラクション設計

#### 1. 中央円の動作（階層性を持つ情報表示）
- **常に「Weight/Cost切り替え」として機能**
- **レベル1（未選択）**: TOTAL値の表示切り替え
- **レベル2（カテゴリ選択）**: 選択カテゴリの値の表示切り替え
- **レベル3（ギア選択）**: 選択ギアの値の表示切り替え（NEW!）

#### 2. 「戻る」操作（階層を1つ上に）
- **レベル3 → レベル2**: 外円（非選択ギア）をクリック → ギア選択解除
- **レベル3 → レベル2**: 選択中のギアをもう一度クリック → ギア選択解除
- **レベル2 → レベル1**: 内円（非選択カテゴリ）をクリック → カテゴリ選択解除
- **レベル2 → レベル1**: 選択中のカテゴリをもう一度クリック → カテゴリ選択解除

## 詳細仕様

### 状態1: カテゴリ未選択

```
中央円の表示:
┌──────────────┐
│   5,234g     │  ← 重量表示（Weight Mode）
│ TOTAL WEIGHT │
└──────────────┘

または

┌──────────────┐
│  ¥234,500    │  ← 金額表示（Cost Mode）
│  TOTAL COST  │
└──────────────┘
```

**操作**:
- 中央円クリック → Weight ⇄ Cost 切り替え
- カテゴリ円クリック → カテゴリ選択

### 状態2: カテゴリ選択中

```
中央円の表示:
┌──────────────┐
│   1,200g     │  ← 選択カテゴリの重量
│   Shelter    │  ← カテゴリ名（色付き）
│ 45% of total │  ← 全体比率
└──────────────┘

または

┌──────────────┐
│  ¥45,000     │  ← 選択カテゴリの金額
│   Shelter    │  ← カテゴリ名（色付き）
│ 45% of total │  ← 全体比率
└──────────────┘
```

**操作**:
- 中央円クリック → Weight ⇄ Cost 切り替え（選択カテゴリ内で）
- 選択中のカテゴリ円クリック → 選択解除
- **薄くなった他カテゴリ円クリック → 選択解除**（NEW!）
- 別のカテゴリ円クリック → カテゴリ切り替え（既存動作）

### 視覚的なフィードバック

#### 中央円のホバー時
```css
cursor: pointer
transform: scale(1.02)
+ アイコン表示: ⇄ （切り替えマーク）
```

#### 薄くなった内円のホバー時
```css
cursor: pointer
opacity: 0.4 → 0.6 （少し濃くなる）
+ ツールチップ: "クリックで選択解除"
```

## 実装方針

### 1. handleCenterClick の変更

**現在**:
```typescript
const handleCenterClick = () => {
  if (selectedCategory) {
    onCategorySelect([])      // 選択解除
    setSelectedItem(null)
  } else {
    onViewModeChange(...)      // 切り替え
  }
  // パルスアニメーション
}
```

**変更後**:
```typescript
const handleCenterClick = () => {
  // 常にWeight/Cost切り替え
  onViewModeChange(viewMode === 'weight' ? 'cost' : 'weight')

  // パルスアニメーション
  setCenterPulse(true)
  setTimeout(() => setCenterPulse(false), 600)
}
```

### 2. handleCategoryClick の変更

**現在**:
```typescript
const handleCategoryClick = (categoryName: string) => {
  if (selectedCategories.includes(categoryName)) {
    onCategorySelect([])       // 選択解除
  } else {
    onCategorySelect([categoryName]) // 選択
  }
  setSelectedItem(null)
}
```

**変更後**:
```typescript
const handleCategoryClick = (categoryName: string) => {
  if (selectedCategories.includes(categoryName)) {
    // 選択中のカテゴリをクリック → 選択解除
    onCategorySelect([])
  } else if (selectedCategories.length > 0) {
    // 別のカテゴリが選択中 → カテゴリ切り替え
    onCategorySelect([categoryName])
  } else {
    // 未選択 → 選択
    onCategorySelect([categoryName])
  }
  setSelectedItem(null)
}
```

### 3. 内円の視覚的改善

```typescript
// カテゴリ選択時に他カテゴリの不透明度を調整
<Cell
  key={`category-${entry.name}`}
  fill={isCategorySelected ? darkenedFillColor : entry.color}
  stroke={isCategorySelected ? darkenedStrokeColor : COLORS.white}
  strokeWidth={isCategorySelected ? 2 : 1}
  opacity={hasSelection && !isCategorySelected ? 0.4 : 1}  // ← 薄くする
  style={{
    filter: isCategorySelected ? `drop-shadow(0 0 6px ${darkenedStrokeColor}99)` : 'none',
    transition: 'all 0.2s ease',
    outline: 'none',
    cursor: 'pointer'  // ← カーソルを常にポインターに
  }}
/>
```

## メリット

### 1. 操作性の向上
- カテゴリ選択中でも即座にWeight/Costを切り替え可能
- 「戻る」操作が直感的（薄い部分をクリック）

### 2. 一貫性
- 中央円は常に「切り替え」として機能
- 内円は常に「カテゴリ選択/解除」として機能

### 3. 発見性
- 薄くなった内円がクリック可能であることが視覚的に明確
- ホバー時のフィードバックで操作を促す

## デメリットと対策

### デメリット1: 既存の操作方法が変わる
- **対策**: スムーズなトランジションとツールチップで学習コストを下げる

### デメリット2: 薄い円が誤クリックされやすい
- **対策**: ホバー時に opacity を 0.6 に上げて、クリック可能エリアを明確に


**提案した改善案（薄い内円で戻る）**を推奨

理由:
1. 追加のUI要素が不要
2. 操作が直感的（薄い = 選択されていない → クリックで戻る）
3. 中央円の一貫性が保たれる（常に切り替え）

## 実装タスク

1. [ ] handleCenterClick を「常に切り替え」に変更
2. [ ] handleCategoryClick に選択解除ロジックを追加
3. [ ] 内円の opacity を動的に調整
4. [ ] ホバー時のスタイル追加
5. [ ] パルスアニメーションの調整
6. [ ] 動作確認とユーザビリティテスト

## 参考UI

類似のインタラクションを持つUI:
- **Google Analytics**: 円グラフ中央にメトリクス表示、クリックで切り替え
- **Tableau**: セグメント選択時に他セグメントを薄く表示
- **Power BI**: 選択要素以外をグレーアウト、クリックで解除

---

作成日: 2025-10-31
更新日: 2025-10-31
