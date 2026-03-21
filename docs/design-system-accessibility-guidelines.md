# Design System指針（コントラスト・知覚・運用）

本書は、UI工学の観点から配色と状態設計を再現可能に運用するための実装指針です。

## 1. コントラスト基準は2系統で監査する

### 1-1. テキスト（可読性）
- 通常テキスト: 4.5:1 以上
- 大きいテキスト: 3:1 以上
- 可能なら本文は 7:1 を目標

### 1-2. 非テキスト（視認性）
- ボーダー、アイコン、入力枠、フォーカスリングは隣接色に対して 3:1 以上

実務ルール:
- 「テキストは読めるがUIが見えない」を防ぐため、`text` と `non-text` は必ず別々にチェックする

## 2. WCAG比率に加えてAPCAを補助評価に使う

- WCAG 2.x は必須合格基準として維持
- APCA は補助指標として導入し、本文・小さい文字・ダーク背景での読解性を点検

実務ルール:
- CIやレビューでは「WCAG fail はNG、APCAは警告」で運用

## 3. 階層は「影」より「面の差分 + overlay」で設計する

- `surface-0/1/2` を定義し、階層差を明度とoverlayで表現
- hover/activeは `overlay.hover`, `overlay.active` で統一
- ダークテーマで影に依存しすぎない

実務ルール:
- 状態差は `背景差 + 境界差 + フォーカス差` の3要素で設計

## 4. 色相は補助チャネルとして使う

- 色だけで意味を伝えない
- 状態は以下を併用する
  - ラベル（テキスト）
  - 形状（枠、バッジ、アイコン）
  - 位置・余白・並び

実務ルール:
- Success/Warning/Danger/Info は `fg/bg/border` の3点セットで必ず定義

## 5. トークン → 状態機械 → 監査の順で運用する

### 5-1. トークンの最小核
- Ink: `ink.primary/secondary/muted/inverse`, `icon.default/muted`
- Surface: `surface.level.0/1/2`
- Stroke: `stroke.subtle/default/strong/divider`
- Focus: `focus.ring`, `focus.ringOffset`
- Overlay: `overlay.hover/active/scrim`
- State: `state.{success|warning|danger|info}.{fg|bg|border}`

### 5-2. 状態機械
対象コンポーネント（Button/Input/Card/Tab/Badge）ごとに以下を定義する:
- `default`
- `hover`
- `active`
- `focus-visible`
- `disabled`
- `selected`
- `error`（該当する場合）

### 5-3. 監査チェックリスト
- text contrast: 4.5:1（大テキストは3:1）
- non-text contrast: 3:1
- focus ring が背景上で視認できる
- 色以外の手がかり（ラベル/形状）を併用している
- ダークテーマで階層差が消えていない

## 6. 現行実装での対応方針

現行トークン基盤（`client/styles/tokens`）では、次を標準とする:
- コンポーネントの色は `gray-*` 直参照を避け、用途トークンを優先
- 共通クラス（`btn-*`, `.input`, `.modal-overlay`）は用途トークンにマップ
- 新規コンポーネントは初期実装時に状態機械を定義する

## 7. 変更時のPRテンプレ要件

UI系PRでは以下を本文に記載する:
- 変更したトークン（用途名）
- 対応した状態（default/hover/active/focus...）
- 影響コンポーネント
- コントラスト観点の確認内容（text / non-text）

