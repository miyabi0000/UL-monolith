---
paths:
  - "client/components/**"
  - "client/hooks/**"
---

# UIコンポーネントルール

## カードビュー
- CardGridView は上部に商品画像（h-20、imageUrl 無しはグレー無地フォールバック）
- 画像下にテキスト3行: 名前 + 優先度 / 重量 + 価格 / WeightClass + カテゴリ + 所持数
- タップで下にスライド展開（ブランド、シーズン、Edit/Link）

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
