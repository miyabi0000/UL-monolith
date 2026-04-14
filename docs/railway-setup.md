# Railway デプロイ手順

UL Gear Manager を Railway で動かす手順。Express + Vite を 1 コンテナで配信し、PostgreSQL は同一プロジェクト内の別サービスを使う。

## 構成

```
┌─ Railway Project ──────────────────────┐
│                                        │
│  ┌─ web service (Dockerfile) ──┐       │
│  │  - Vite build (dist/)        │       │
│  │  - Express (server/dist/)    │       │
│  │  - 8000 番ポート公開         │       │
│  └──────┬───────────────────────┘       │
│         │ DATABASE_URL                  │
│         ▼                               │
│  ┌─ PostgreSQL plugin ──────────┐       │
│  │  - 自動 backup               │       │
│  │  - PR Environment 毎に複製   │       │
│  └──────────────────────────────┘       │
│                                        │
└────────────────────────────────────────┘
```

## 初期セットアップ (1 回だけ)

### 1. Railway プロジェクト作成

1. https://railway.app にサインアップ (GitHub 連携)
2. New Project → Deploy from GitHub Repo → `miyabi0000/UL-monolith` を選択
3. Railway が `railway.json` と `Dockerfile` を検出してビルド開始

### 2. PostgreSQL 追加

1. プロジェクト画面で `+ New` → `Database` → `PostgreSQL`
2. 自動的に `DATABASE_URL` 環境変数が web service にリンクされる

### 3. 環境変数を web service に設定

`Variables` タブで以下を追加:

| 変数名 | 値 | 必須 |
|---|---|---|
| `NODE_ENV` | `production` | ✅ |
| `COGNITO_USER_POOL_ID` | (AWS Cognito User Pool ID) | ✅ |
| `COGNITO_CLIENT_ID` | (Cognito App Client ID) | ✅ |
| `OPENAI_API_KEY` | (OpenAI API key) | LLM 機能を使う場合 |
| `RATE_LIMIT_MAX` | `100` | 任意 |
| `LLM_RATE_LIMIT_MAX` | `10` | 任意 |
| `DATABASE_SSL` | `true` (デフォルト) | Railway PostgreSQL は SSL 必須 |

`DATABASE_URL` は PostgreSQL プラグインが自動で注入する。

### 4. クライアントビルド時の環境変数

Vite は `VITE_*` プレフィックスの環境変数のみクライアントに埋め込む。Cognito クライアント設定はビルド時に必要なので Railway の `Variables` に追加:

| 変数名 | 値 |
|---|---|
| `VITE_COGNITO_USER_POOL_ID` | (= COGNITO_USER_POOL_ID と同じ値) |
| `VITE_COGNITO_CLIENT_ID` | (= COGNITO_CLIENT_ID と同じ値) |
| `VITE_API_BASE_URL` | (空。同一オリジンで配信されるので不要) |

### 5. デプロイ実行

`Deployments` タブで「Deploy」→ 数分待つ。

成功すると Railway がパブリック URL を発行 (`*.up.railway.app`)。

## PR Environments を有効化

PR ごとにプレビュー環境 (web + DB) が作られるよう設定:

1. プロジェクト設定 → `Environments` タブ
2. `Enable PR Environments` をオン
3. ベースブランチ: `main` を選択

これで PR を作成するたびに:
- 一意の URL (`pr-{number}.up.railway.app`) が発行
- PostgreSQL も PR 毎に独立した DB が作られる (or main 環境の DB を共有するかは設定で選択)
- マージで自動破棄

GitHub PR には Railway が自動でプレビュー URL をコメント。

## Cognito の扱い

User Pool は **本番と PR で 1 つを共用** する方針 (今回の決定):
- 利点: PR 毎に Cognito リソースを作る手間が無い、テストユーザーを使い回せる
- 注意: PR 環境で作ったユーザーが本番 Pool に残るので、定期クリーンアップが必要
- Callback URL: Cognito アプリクライアント設定で `https://*.up.railway.app/*` をワイルドカード許可

## ローカル動作確認 (Docker)

Railway と同じビルドをローカルで確認:

```bash
docker build -t ul-gear-manager .
docker run -p 8000:8000 \
  -e DATABASE_URL=postgres://postgres:password@host.docker.internal:5433/gear_manager \
  -e DATABASE_SSL=false \
  -e NODE_ENV=production \
  ul-gear-manager
```

http://localhost:8000 でフロント、`/api/health` でサーバー疎通確認。

## マイグレーション

デプロイ毎にコンパイル済みの `server/dist/scripts/migrate.js` が起動コマンドの先頭で実行される (`Dockerfile` の `CMD`)。

- `server/database/init.sql` は **users テーブルが無い時のみ** 初回適用 (Railway Postgres は素のインスタンスなので必須)
- `server/database/migrations/*.sql` は `schema_migrations` テーブルで適用済みを追跡し、未適用のみ実行
- 失敗時はトランザクション ROLLBACK + プロセス exit 1 → Railway がリスタート

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| Build エラー: `vite: not found` | npm ci の前に `dist/` をコピーしてしまった | `Dockerfile` の COPY 順を確認 |
| DB 接続エラー: SSL required | `DATABASE_SSL=false` のまま本番接続 | 環境変数を削除 (デフォルト true) |
| 401 Authorization required | `COGNITO_USER_POOL_ID` 未設定 | Variables に追加してリデプロイ |
| マイグレーション失敗 | 既存 schema との衝突 | Railway PostgreSQL の data tab で SQL 直接実行して修正 |
