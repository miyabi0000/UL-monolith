# State Unification Design (Card / Table / GearChart)

## Goal
Card・Table・GearChart の UI 操作が同じ選択コンテキストを共有し、
「どこで操作しても同じ選択結果になる」状態にする。

## Principles
- Single Source of Truth: 共有状態は最小共通祖先で保持する
- Presentational/Container 分離: 子コンポーネントは描画とイベント通知に集中
- Controlled-first API: 選択系フックは外部制御を受けられる設計にする

## Unified States
`HomePage` を state owner として以下を保持:
- `selectedCategories: string[]`
- `selectedItemId: string | null`
- `selectedIds: string[]` (compare/edit/bulk selection)

## Data Flow
1. `HomePage` -> `GearChart` に unified state を props で注入
2. `GearChart` は内部ローカルだった `selectedItem` を排除し、`onSelectedItemChange` を使用
3. `GearDetailPanel` は `selectedIds` を controlled で受け取り、`useItemSelection` で更新
4. `CardGridView` に `onItemSelect` を追加し、Card からも `selectedItemId` を更新

## Implemented Files
- `client/components/HomePage.tsx`
- `client/components/GearChart.tsx`
- `client/components/GearDetailPanel.tsx`
- `client/components/DetailPanel/CardGridView.tsx`
- `client/hooks/useItemSelection.ts`

## Notes
- `useItemSelection` は controlled / uncontrolled 両対応に変更
- フィルタ変更で非表示になった選択IDは自動的に除外（stale selection 回避）
