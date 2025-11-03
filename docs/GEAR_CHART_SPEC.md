# GearChart & 右側パネル 統合仕様書

## 概要

GearChartは、ギアの重量・金額を視覚化する3階層のインタラクティブな円グラフコンポーネントです。右側のGearDetailPanelと統合され、詳細情報の表示と編集機能を提供します。

---

## 1. 全体構成

### レイアウト
```
┌─────────────────────────────────────────────────────────────┐
│ [パンくずリスト]                      [GEAR ANALYSIS]       │
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│      GearChart (左側)            │  GearDetailPanel (右側)  │
│   - 3階層パイチャート             │   - Overview             │
│   - 中央円（値表示・切り替え）    │   - Category Summary     │
│   - クリックでドリルダウン        │   - Item Detail          │
│                                  │                          │
└──────────────────────────────────┴──────────────────────────┘
```

### コンポーネント構造
- **GearChart.tsx**: メインチャートコンポーネント（約600行）
- **GearDetailPanel.tsx**: 右側詳細パネル（約60行）
- **DetailPanel/OverviewView.tsx**: 全体統計ビュー（約130行）
- **DetailPanel/CategorySummaryView.tsx**: カテゴリ別統計ビュー（約170行）
- **GearCardCompact.tsx**: 個別ギア詳細ビュー（約240行）

---

## 2. パンくずリスト

### 表示形式
常に左上に階層構造を表示：

**レベル1 (ALL表示)**:
```
ALL  (太字)
```

**レベル2 (カテゴリ選択)**:
```
ALL › Backpack  (Backpackが太字)
```

**レベル3 (アイテム選択)**:
```
ALL › Backpack › Tent  (Tentが太字)
```

### 機能
- **クリック可能**: 各レベルをクリックでその階層に戻る
- **現在位置強調**: 現在のレベルは太字で表示
- **スライドインアニメーション**: 新しい階層に移動時にアニメーション
- **フォントサイズ**: `text-xs`（小さく表示）

### 実装
```typescript
// パンくずリスト用の選択中アイテム名を取得
const selectedItemName = useMemo(() => {
  if (!selectedItem || !items) return null
  const item = items.find(i => i.id === selectedItem)
  return item?.name || null
}, [selectedItem, items])

// パンくずリストナビゲーションのハンドラ
const handleBreadcrumbClick = useCallback((level: 'all' | 'category') => {
  if (level === 'all') {
    onCategorySelect([])
    setSelectedCategoryForPanel(null)
    setSelectedItem(null)
    setPanelMode('overview')
  } else if (level === 'category') {
    setSelectedItem(null)
    setPanelMode('category')
  }
}, [onCategorySelect])
```

---

## 3. GearChart - 3階層インタラクション

### 階層構造

#### レベル1: ALL表示（未選択）
```
┌──────────────────────┐
│   ○ ○ ○ ○ ○ ○       │  ← 内円：カテゴリ
│      ●━━●            │  ← 中央円
│    5,234g            │
│  TOTAL WEIGHT        │
└──────────────────────┘
```

**表示内容**:
- 内円: カテゴリ別の円グラフ
- 中央円: 総重量または総金額

**操作**:
- 中央円クリック → Weight ⇄ Cost 切り替え
- カテゴリ円クリック → レベル2へ

#### レベル2: カテゴリ選択
```
┌──────────────────────┐
│   ○ ○ ○ ○ ○ ○       │  ← 内円：カテゴリ（薄く表示）
│   ● ● ● ● ● ●       │  ← 外円：アイテム
│      ●━━●            │  ← 中央円
│     1,200g           │
│    Backpack          │
│   45% of total       │
└──────────────────────┘
```

**表示内容**:
- 内円: カテゴリ（選択中は強調、他は薄く表示 opacity: 0.4）
- 外円: 選択カテゴリ内のアイテム
- 中央円: 選択カテゴリの重量/金額、名前、全体比率

**操作**:
- 中央円クリック → Weight ⇄ Cost 切り替え
- 選択中のカテゴリ円クリック → レベル1へ
- 他のカテゴリ円クリック → そのカテゴリを選択
- アイテム円クリック → レベル3へ

#### レベル3: アイテム選択
```
┌──────────────────────┐
│   ○ ○ ○ ○ ○ ○       │  ← 内円：カテゴリ（薄く表示）
│   ● ● ● ● ● ●       │  ← 外円：アイテム（選択強調）
│      ●━━●            │  ← 中央円
│      670g            │
│   Tent (Brand)       │
│   25% of total       │
└──────────────────────┘
```

**表示内容**:
- 内円: カテゴリ（薄く表示）
- 外円: アイテム（選択中は暗色化 + drop-shadow）
- 中央円: 選択アイテムの重量/金額、名前、ブランド、全体比率

**操作**:
- 中央円クリック → Weight ⇄ Cost 切り替え
- 選択中のアイテム円クリック → レベル2へ
- 他のアイテム円クリック → そのアイテムを選択

### 中央円の動作

**常に「Weight/Cost切り替え」として機能**:

```typescript
const handleCenterClick = useCallback(() => {
  // 常にWeight/Cost切り替え（カテゴリ選択状態に関係なく）
  onViewModeChange(viewMode === 'weight' ? 'cost' : 'weight')

  // パルスアニメーション
  setCenterPulse(true)
  setTimeout(() => setCenterPulse(false), 600)
}, [viewMode, onViewModeChange])
```

### 視覚的フィードバック

#### 選択中の要素
- 暗色化: `darkenColor(color, 0.15)`
- ドロップシャドウ: `drop-shadow(0 0 6px ${color}99)`
- ストローク幅: `2px`

#### 非選択の要素（カテゴリ/アイテム選択時）
- 不透明度: `opacity: 0.4`
- ホバー時: `opacity: 0.6` (Tailwind: `hover:opacity-60`)

#### 中央円
- ホバー時: `scale(1.02)`
- クリック時: パルスアニメーション（600ms）
- カーソル: `cursor: pointer`

#### トランジション
- すべての状態変化: `transition: all 0.2s ease`

### 色の生成

#### カテゴリの色
各カテゴリには固有の色が割り当てられます（CategoryManagerで設定）。

#### アイテムの色
カテゴリの基本色からHSLグラデーションを生成：

```typescript
const generateItemColor = (baseColor: string, index: number, total: number): string => {
  // HEXからRGBに変換
  // RGBからHSLに変換
  // 明度を調整してグラデーション生成
  return `hsl(${h}, ${s}%, ${newL}%)`
}
```

---

## 4. GearDetailPanel - 右側詳細パネル

### パネルモード

#### Mode 1: Overview（全体統計）
**表示タイミング**: レベル1（未選択時）

**表示内容**:
- **OVERVIEW セクション**:
  - Items: 総アイテム数
  - Avg Weight: 平均重量
  - Weight: 総重量
  - Price: 総価格
  - Shortage: 不足数（不足がある場合のみ）
  - Priority 1: 高優先度アイテム数（該当がある場合のみ）

- **DETAILS セクション**:
  - Heaviest: 最重量アイテム
  - Most Expensive: 最高価格アイテム

**実装**: `DetailPanel/OverviewView.tsx`

#### Mode 2: Category Summary（カテゴリ別統計）
**表示タイミング**: レベル2（カテゴリ選択時）

**表示内容**:
- **カテゴリ名**: 色付きバッジ表示
- **STATS セクション**:
  - Items: カテゴリ内アイテム数
  - Avg Weight: カテゴリ内平均重量
  - Weight: カテゴリ合計重量
  - Price: カテゴリ合計価格
  - Shortage: カテゴリ内不足数（不足がある場合のみ）

- **ITEMS セクション**:
  - アイテムリスト（画像付き）
  - 各アイテム: 名前、所有数/必要数、重量、優先度
  - 不足インジケーター（!マーク）

**操作**:
- アイテム行クリック → そのアイテムを選択（レベル3へ）

**実装**: `DetailPanel/CategorySummaryView.tsx`

#### Mode 3: Item Detail（個別ギア詳細）
**表示タイミング**: レベル3（アイテム選択時）

**表示内容**:
- 画像（大）
- アイテム名
- ブランド
- カテゴリバッジ
- 重量 / 価格
- 所有数 / 必要数
- 優先度（色付き）
- シーズン表示（SeasonBar）
- アクションボタン:
  - Edit（編集）
  - URL（商品ページを開く）
  - Delete（削除）

**操作**:
- Editボタン → 編集モーダル表示
- URLボタン → 商品ページを新規タブで開く
- Deleteボタン → 削除確認後、削除

**実装**: `GearCardCompact.tsx`

---

## 5. 廃止された機能

### ホバーツールチップ（廃止済み）
**理由**: 右側パネルと機能が重複し、冗長

**廃止内容**:
- `CustomTooltip` コンポーネント
- `Tooltip` from recharts
- ホバーヒント表示（"Click to view category summary" など）
- `getPriorityColor` インポート（ツールチップでのみ使用）

**代替手段**:
- すべての詳細情報は右側のGearDetailPanelで表示

---

## 6. レスポンシブ対応

### ブレークポイント
- **Mobile**: `width < 768px`
- **Tablet**: `768px <= width < 1024px`
- **Desktop**: `width >= 1024px`

### チャートサイズ
```typescript
const CHART_CONFIG = {
  height: {
    mobile: 500,
    tablet: 600,
    desktop: 650
  },
  outerRadius: {
    mobile: { outer: 130, inner: 95 },
    tablet: { outer: 180, inner: 130 },
    desktop: { outer: 220, inner: 160 }
  },
  innerRadius: {
    mobile: { outer: 95, inner: 60 },
    tablet: { outer: 130, inner: 85 },
    desktop: { outer: 160, inner: 105 }
  },
  centerMaxWidth: {
    mobile: 110,
    tablet: 150,
    desktop: 190
  }
}
```

### レイアウト変更
- **Desktop**: 左右2カラム（チャート + パネル）
  - グリッド: `grid-cols-[1fr_320px]`
  - パネル幅: 固定320px
- **Mobile/Tablet**: 1カラム（縦並び）
  - グリッド: `grid-cols-1`

---

## 7. データフロー

### Props
```typescript
interface GearChartProps {
  data: ChartData[]              // カテゴリ別データ
  totalWeight: number            // 総重量
  totalCost: number              // 総金額
  viewMode: ChartViewMode        // 'weight' | 'cost'
  selectedCategories: string[]   // 選択中のカテゴリ
  onCategorySelect: (categories: string[]) => void
  onViewModeChange: (mode: ChartViewMode) => void
  items: any[] // すべてのギアアイテム
  onEdit: (item: any) => void
  onDelete: (id: string) => void
}
```

### 内部状態
```typescript
const [selectedItem, setSelectedItem] = useState<string | null>(null)
const [selectedCategoryForPanel, setSelectedCategoryForPanel] = useState<string | null>(null)
const [panelMode, setPanelMode] = useState<PanelMode>('overview')
const [centerPulse, setCenterPulse] = useState(false)
const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
```

### パネルモード管理
```typescript
export type PanelMode = 'item' | 'category' | 'overview';

// モードに応じた表示切り替え
{mode === 'item' && (
  <GearCardCompact
    item={selectedItem}
    viewMode={viewMode}
    onEdit={onEdit}
    onDelete={onDelete}
  />
)}

{mode === 'category' && selectedCategory && (
  <CategorySummaryView
    categoryName={selectedCategory}
    items={items}
    viewMode={viewMode}
    onItemClick={onItemClick}
  />
)}

{mode === 'overview' && (
  <OverviewView items={items} viewMode={viewMode} />
)}
```

---

## 8. アニメーション

### スライドインアニメーション
パンくずリストの階層移動時に使用：

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

適用箇所:
- パンくずリストの新規階層表示時

### パルスアニメーション
中央円クリック時のフィードバック：

```typescript
setCenterPulse(true)
setTimeout(() => setCenterPulse(false), 600)
```

中央円のスタイル:
```typescript
style={{
  backgroundColor: centerPulse ? 'rgba(64, 64, 64, 0.05)' : 'transparent',
  transform: centerPulse ? 'scale(1.05)' : 'scale(1)',
  boxShadow: centerPulse ? '0 0 20px rgba(64, 64, 64, 0.3)' : 'none'
}}
```

---

## 9. 実装ファイル

### 主要コンポーネント
- `client/components/GearChart.tsx` (約600行)
- `client/components/GearDetailPanel.tsx` (約60行)
- `client/components/DetailPanel/OverviewView.tsx` (約130行)
- `client/components/DetailPanel/CategorySummaryView.tsx` (約170行)
- `client/components/GearCardCompact.tsx` (約240行)

### スタイル
- `client/styles/globals.css` (slideInアニメーション定義)

### 型定義
- `client/utils/types.ts`
  - `ChartData`
  - `ChartViewMode`
  - `GearItemWithCalculated`
  - `PanelMode`

### デザインシステム
- `client/utils/designSystem.ts`
  - `COLORS`
  - `getCategoryBadgeStyle`

---

## 10. パフォーマンス最適化

### メモ化
- **GearChart**: `React.memo` でコンポーネント全体をメモ化
- **OverviewView**: `React.memo` + `useMemo` で統計計算をメモ化
- **CategorySummaryView**: `React.memo` + `useMemo` でフィルタリングをメモ化
- **GearDetailPanel**: `React.memo` でプロップス変更時のみ再レンダリング

### コールバック最適化
```typescript
const handleCategoryClick = useCallback((categoryName: string) => {
  // カテゴリクリック処理
}, [selectedCategories, onCategorySelect])

const handleItemClick = useCallback((itemId: string) => {
  // アイテムクリック処理
}, [selectedItem, selectedCategoryForPanel])
```

### データ処理最適化
```typescript
const sortedData = useMemo(() => {
  return [...displayData].sort((a, b) => b.value - a.value).map(category => ({
    // データ変換処理
  }))
}, [displayData, totalValue, viewMode])
```

---

## 11. 今後の改善案

### パフォーマンス
- [ ] チャートデータのmemo化最適化
- [ ] 大量アイテム時の仮想化
- [ ] 画像の遅延読み込み最適化

### UX
- [ ] キーボードナビゲーション対応
- [ ] ドラッグでの値比較
- [ ] アニメーション設定のカスタマイズ

### アクセシビリティ
- [ ] ARIA属性の追加
- [ ] スクリーンリーダー対応
- [ ] キーボード操作の改善
- [ ] カラーコントラストの改善

---

## 12. 参考UI

類似のインタラクションを持つUI:
- **Google Analytics**: 円グラフ中央にメトリクス表示、クリックで切り替え
- **Tableau**: セグメント選択時に他セグメントを薄く表示
- **Power BI**: 選択要素以外をグレーアウト、クリックで解除

---

作成日: 2025-11-03
最終更新: 2025-11-03
バージョン: 2.0