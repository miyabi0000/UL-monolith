---
paths:
  - "server/database/**"
  - "server/routes/packs.ts"
---

# データベースルール

## マイグレーション
- 新規テーブル・カラム追加は `server/database/migrations/` に SQL ファイルを作成
- ファイル名: `NNN_description.sql`（連番）
- 既存: 001〜004 が使用済み
- 必ず既存の `init.sql` と整合性を確認

## localStorage → DB 移行
- パック (`usePacks.ts`) とプロフィール (`useProfile.ts`) は現在 localStorage
- DB移行後は API 経由で読み書き
- 初回ログイン時に localStorage データを DB に移行 → localStorage 削除
- 移行処理はクライアント側で実装（サーバーは通常のCRUD APIのみ）

## クエリパターン
- 既存の `connection.ts` のパターンに従う（pg プール + パラメータ化クエリ）
- JOINは効率的に。N+1 クエリを避ける
