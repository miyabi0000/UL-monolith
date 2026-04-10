# UL Gear Manager - Claude Code Rules

このファイルは、Claude Codeがプロジェクトを理解し、一貫したコードを生成するためのルールとガイドラインを定義します。

## Claude Code 作業原則

### 基本姿勢
- **変更前に必ずコードを読む** — 対象ファイルと周辺コードを理解してから編集する
- **1回の変更は小さく保つ** — 1つのPRで1つの関心事。大きな変更は分割する
- **既存スタイルに従う** — 新しいパターンを持ち込まず、周囲のコードに合わせる
- **不明点を勝手に拡大解釈しない** — 指示が曖昧なら確認する。推測で範囲を広げない

### 変更時のルール
- 関連するテストがあれば確認・更新する
- PR前に `npm run lint` と `npm run build` が通ることを確認する
- `npm run typecheck` も実行し、新たな型エラーを増やさない

### 注意が必要な変更
以下は影響が大きいため、実行前に必ず確認を取る:
- **破壊的変更**: API レスポンス形式の変更、props の削除・リネーム
- **広範囲リファクタ**: 複数ファイルにまたがる構造変更
- **依存追加**: `npm install` で新しいパッケージを追加する場合
- **設定変更**: tsconfig、eslint、vite.config の変更

## プロジェクト概要

**UL Gear Manager** - ウルトラライト（UL）ハイキング用ギア管理アプリケーション
- フロントエンド: React + TypeScript + Vite
- バックエンド: Node.js + Express + TypeScript
- スタイル: Tailwind CSS + 統一デザインシステム

## コーディング規則

### 1. TypeScript
- すべてのファイルでTypeScriptを使用
- strict modeを有効化
- 型定義は`client/utils/types.ts`と`server/models/types.ts`に集約
- any型の使用は最小限に抑制

### 2. React コンポーネント
- 関数コンポーネントを使用（クラスコンポーネント禁止）
- コンポーネント名はPascalCase
- Propsの型定義を必須とする
- カスタムフックは`use`プレフィックス必須

### 3. 状態管理
- 複雑な状態はカスタムフックに分離
- `useAppState` - アプリケーション全体の状態管理
- `useNotifications` - 通知システム管理
- 不要な状態の巻き上げを避ける

### 4. API設計
- RESTful APIパターンに従う
- エラーハンドリングは統一フォーマット
- レスポンス形式:
  ```json
  {
    "success": boolean,
    "data": any,
    "message": string,
    "error": string
  }
  ```

### 5. デザインシステム
- `client/utils/designSystem.ts`の統一デザインシステム使用必須
- カラーパレットは`COLORS`オブジェクトから取得
- グラスエフェクト、ボタン、カードのバリアントを活用
- インラインスタイルは避け、デザインシステム関数を使用

### 6. 通知システム
- エラー・成功・ローディング表示は右端ポップアップ使用
- `useNotifications`フックで管理
- 自動非表示: 成功4秒、エラー6秒、ローディング手動
- コンポーネント内でのエラー表示は禁止

### 7. パフォーマンス最適化
- APIクエリでO(1)アクセスのためMap/Set使用
- 大量データ処理時は効率的なアルゴリズム採用
- useCallbackでAPI関数を安定化
- 遅延ロード（React.lazy）でコード分割

### 8. ファイル構造
```
client/
├── components/          # Reactコンポーネント
├── hooks/              # カスタムフック
├── services/           # API通信
├── utils/              # ユーティリティ・型定義
└── main.tsx           # エントリーポイント

server/
├── routes/            # APIルート
├── services/          # ビジネスロジック
├── utils/             # ヘルパー関数
├── models/            # 型定義
└── app.ts            # サーバーエントリー
```

### 9. 命名規則
- ファイル名: camelCase または PascalCase（コンポーネント）
- 変数・関数: camelCase
- 定数: UPPER_SNAKE_CASE
- 型定義: PascalCase
- CSS クラス: kebab-case（Tailwind準拠）

### 10. エラーハンドリング
- try-catch でエラーキャッチ
- エラーを上位コンポーネントに委譲（throw）
- 通知システムでユーザーフレンドリーなメッセージ表示
- コンソールエラーには詳細情報を出力

### 11. コメント・ドキュメント
- コメントは日本語で記述
- 複雑なロジックには説明コメント必須
- TODO コメントには担当者・期限を記載
- API関数にはJSDoc形式のコメント

### 12. Git管理
- ブランチ命名: `feat/機能名`, `fix/修正内容`, `refactor/リファクタ内容`
- コミットメッセージ: 日本語で簡潔に
- プルリクエストには変更概要とテスト項目を記載

## 開発環境

### コマンド一覧
```bash
npm run dev            # フロントエンド開発サーバー (Vite, port 3001)
npm run server:dev     # バックエンド開発サーバー (tsx watch, port 8000)
npm run build          # フロントエンドビルド (Vite)
npm run server:build   # サーバービルド (tsc)
npm run lint           # ESLint
npm run typecheck      # 型チェック (client + server)
```

### ポート設定
- フロントエンド: http://localhost:3001
- バックエンド: http://localhost:8000
- Health Check: http://localhost:8000/api/health

## 最近の重要な変更

### 2025-09-22: 右端通知ポップアップシステム導入
- 従来のエラー・成功メッセージをポップアップ形式に変更
- `NotificationPopup`コンポーネントと`useNotifications`フック追加
- `useAppState`から通知関連状態を削除し、責務を分離
- サーバーAPIのパフォーマンス最適化（O(n)→O(1)）

### 推奨事項
1. **新機能追加時**: 既存のデザインシステムとパターンに従う
2. **API修正時**: レスポンス形式の一貫性を保つ
3. **コンポーネント作成時**: 通知システムを活用し、エラー表示を統一
4. **パフォーマンス**: 大量データ処理時はMap/Setの使用を検討

## 現在のロードマップ

詳細は `docs/design-roadmap.md` と `docs/monetization-proposal.md` を参照。

### 出荷に向けた優先度順
1. **P0: 認証基盤** — AWS Cognito（モック認証を置換）
2. **P0: パック/プロフィールのDB移行** — localStorage → PostgreSQL
3. **P1: カードビュー改善** — テキストベースのコンパクト表示 + タップ展開
4. **P1: AIアドバイザー強化** — 会話永続化、クイックプロンプト、一括適用+Undo
5. **P2: g/oz 切り替え** — `client/utils/weightUnit.ts` 作成済み、UIへの適用が残り
6. **P2: 多言語対応** — 最低限 英語

### スコープ外（やらない）
- CSV入出力（優先度低）
- アフィリエイトリンク（ローンチ後に検討）
- コミュニティ機能（ユーザー基盤ができてから）
- ネイティブモバイルアプリ

### 重量単位ユーティリティ
- `client/utils/weightUnit.ts` — g/oz 変換・フォーマット・CSV入出力関数を作成済み
- DBはグラム保存のまま、表示層で変換する方針

## 注意事項
- OpenAI APIキー未設定時はフォールバック応答を使用
- 本番環境では環境変数の適切な設定が必要
- セキュリティ: 認証情報をコードに含めない
- パック/プロフィールは現在 localStorage 保存（DB移行予定）