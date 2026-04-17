---
paths:
  - "client/components/**"
  - "client/hooks/**"
---

# UIコンポーネントルール

## カードビュー
- CardGridView は画像ベースのカード。角丸なし
- アスペクト比は `aspect-[4/3]` + `object-contain` で画像見切れ防止
- 通常時: 画像のみ表示（imageUrl がなければ名前テキストのプレースホルダー）
- タップでグリッド行の直下にフルワイド展開（名前、重量、価格、カテゴリ、ブランド、シーズン、Edit/Link）
- 展開パネルは `gridColumn: '1 / -1'` + `gridRow: 'span 2'`、グリッドは `grid-flow-row-dense` で横の空きセルに後続カードを詰める
- 展開トグルはローカル state（`expandedId`）に閉じる。`onItemSelect` 等を発火させて親の副作用を誘発しない
- 優先度はテーブルと同じ数字表記 (1-5)、控えめに表示

## 重量表示
- `client/utils/weightUnit.ts` の関数を使用
- DB はグラム保存。表示層でのみ g/oz 変換
- `formatWeight(grams, unit)` で統一フォーマット

## AIアドバイザー
- 会話永続化が優先（DB保存）
- クイックプロンプトを入力欄の上に配置
- 提案の一括適用 + Undo を実装

## デザインシステム
- `client/utils/designSystem.ts` のバリアント・カラーを必ず使用
- インラインスタイルは避け、designSystem 関数で統一
- 通知は `useNotifications` フック経由
