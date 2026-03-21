# Card / Table / GearChart 連携 現状整理

## 1. 現在の状態モデル（As-Is）

### 1-1. ルート状態（HomePage）
- `viewMode`（weight/cost/weight-class）: `client/components/HomePage.tsx:63`
- `quantityDisplayMode`（owned/need/all）: `client/components/HomePage.tsx:66`
- `gearViewMode`（table/card/compare）: `client/components/HomePage.tsx:69`
- `selectedCategories`（カテゴリ名配列）: `client/components/HomePage.tsx:75`
- `showCheckboxes`（編集モード）: `client/components/HomePage.tsx:33`

`HomePage` は上記を `GearChart` にまとめて渡している: `client/components/HomePage.tsx:211`

### 1-2. GearChart 内ローカル状態
- `selectedItem`（チャートから選択されたアイテムID）: `client/components/GearChart.tsx:172`
- `chartFocus`（weight-class の all/big3/other）: `client/components/GearChart.tsx:178`

カテゴリ選択は `onCategorySelect` で上位へ反映し、アイテム選択はローカルに閉じる:
- カテゴリ選択: `client/components/GearChart.tsx:315`
- アイテム選択: `client/components/GearChart.tsx:324`

`GearDetailPanel` へは以下を渡して連携:
- `filteredByCategory={selectedCategories}`: `client/components/GearChart.tsx:1186`
- `selectedItemId={selectedItem}`: `client/components/GearChart.tsx:1188`

### 1-3. GearDetailPanel 内ローカル状態
- ソート・通貨・変更ハイライトを内部管理: `client/components/GearDetailPanel.tsx:56` 以降
- 選択状態は `useItemSelection(processedItems)` で内部管理: `client/components/GearDetailPanel.tsx:108`
- 比較状態は `useComparisonMode(selectedItems)` で内部管理: `client/components/GearDetailPanel.tsx:149`

ビューごとの挙動:
- `card`: `CardGridView` を表示（読み取り中心）: `client/components/GearDetailPanel.tsx:215`
- `table/compare`: `BulkActionBar + Table` を表示: `client/components/GearDetailPanel.tsx:229`

## 2. 連携の強み（現時点でできていること）

- チャートのカテゴリ選択は一覧フィルタに反映される
  - `selectedCategories` を上位で保持し、`filterByCategories` で反映: `client/utils/sortHelpers.ts:75`
- チャートのアイテム選択は Table 行ハイライトに反映される
  - `selectedItemId` -> `isHighlighted`: `client/components/GearDetailPanel.tsx:274`
- Compare 実行条件（2件以上/同カテゴリ）はフックに集約済み
  - `validateComparisonItems`: `client/hooks/useComparisonMode.ts:42`

## 3. 連携が弱いポイント（改善対象）

### A. Card 側が「受動表示」になっており、選択文脈を返せない
- `CardGridView` は `selectedItemId` を受けるが、クリックイベントを外へ返す props がない
  - `client/components/DetailPanel/CardGridView.tsx:5`
- そのため Card から Table/Chart へ逆連携できない（片方向）

### B. 選択状態（selectedIds）が GearDetailPanel ローカルで、Chart と共有されない
- 選択は `useItemSelection` の内部状態のみ: `client/components/GearDetailPanel.tsx:108`
- Chart 側は `selectedItem` だけ保持しており、比較対象選択と文脈分断
  - `client/components/GearChart.tsx:172`

### C. Compare 操作導線がモード依存で分かりづらい
- Compare 開始は `gearViewMode === 'compare'` かつ BulkActionBar 経由
  - `client/components/GearDetailPanel.tsx:241`
- 一方で切替ボタンは Chart ヘッダ側にあり、状態遷移が分散
  - `client/components/GearChart.tsx:1047`

### D. 旧実装が残っていて責務の所在が不明瞭
- `HomePage` で `GearTable`/`GearView` を import しているが未使用
  - `client/components/HomePage.tsx:9`
  - `client/components/HomePage.tsx:10`
- `client/components/GearTable/index.tsx` も独自に選択/比較状態を持つため、現行 `GearDetailPanel` と二重化
  - `client/components/GearTable/index.tsx:47`
  - `client/components/GearTable/index.tsx:171`

### E. キーの定義がカテゴリ `name` 依存
- フィルタ判定が `category.name` 比較（IDではない）
  - `client/utils/sortHelpers.ts:83`
- 将来、同名カテゴリやリネーム時に意図しない連携不整合のリスク

## 4. 直感性を下げている主因（要約）

1. 「カテゴリ選択」と「アイテム選択」と「比較選択」が別々の state owner を持っている
2. Card は表示専用で、操作の起点になれない
3. View 切替（Chartヘッダ）と選択操作（DetailPanel）が分断され、ユーザーに状態の所在が見えない

## 5. 次フェーズ（設計着手用の入口）

- 単一 `UISelectionState`（例: `{ activeCategoryIds, activeItemId, selectedItemIds, compareOpen }`）を `HomePage` または専用フックに集約
- `GearChart` / `GearDetailPanel` / `CardGridView` は「イベント通知 + 描画」に寄せる
- まず Card に `onItemSelect` を追加し、双方向同期の最小経路を作る
