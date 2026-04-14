# デプロイ設定

UL Gear Manager の STG 環境自動デプロイ設定ドキュメント。

## アーキテクチャ

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  GitHub     │  push   │  Vercel      │         │  Railway     │
│  main       ├────────►│  (Frontend)  │         │  (Backend)   │
└──────┬──────┘         └──────┬───────┘         └──────┬───────┘
       │                       │                        │
       │                       │ VITE_API_BASE_URL      │
       │ GitHub連携 (Railway)  ├───────────────────────►│
       └──────────────────────►│                        │
                               │ /api/v1/*              │
                               └───────────────────────►│
                                                        │
                                                 ┌──────┴───────┐
                                                 │  Postgres    │
                                                 │  (Railway)   │
                                                 └──────────────┘
```

- **フロントエンド**: Vercel (GitHub Actions 経由)
- **バックエンド**: Railway (GitHub 連携による自動デプロイ)
- **DB**: Railway Postgres プラグイン

## トリガー条件

| 変更箇所 | Vercel | Railway |
|---|:---:|:---:|
| `client/**`, `vite.config.ts` | ○ | × |
| `server/**` | ○ (念のため) | ○ |
| `package.json`, `package-lock.json` | ○ | ○ |
| `railway.json` | × | ○ |
| `docs/**`, `*.md` | × | × |

Railway 側は [railway.json](../railway.json) の `watchPatterns` で制御。
Vercel 側は全 push でビルドするが、フロントのみなので軽量。

## 初回セットアップ

### 1. Railway (バックエンド)

1. https://railway.app で新規プロジェクト作成
2. "Deploy from GitHub repo" で本リポジトリを連携
3. **Settings**:
   - Root Directory: `/`
   - Branch: `main`
4. **Plugins**: Postgres を追加 (`DATABASE_URL` が自動注入される)
5. **Variables** に以下を設定:
   ```
   NODE_ENV=production
   COGNITO_USER_POOL_ID=<値>
   COGNITO_CLIENT_ID=<値>
   AWS_REGION=<値>
   OPENAI_API_KEY=<値>
   RATE_LIMIT_MAX=100
   LLM_RATE_LIMIT_MAX=10
   ```
6. デプロイ完了後、公開 URL を控える (例: `ul-gear-api.up.railway.app`)
7. 初回のみマイグレーション実行 (Railway CLI か一時的にエンドポイント経由)

### 2. Vercel (フロントエンド)

1. https://vercel.com で新規プロジェクト作成
2. Framework Preset: **Vite**
3. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://<Railway URL>/api/v1
   VITE_COGNITO_USER_POOL_ID=<値>
   VITE_COGNITO_CLIENT_ID=<値>
   VITE_AWS_REGION=<値>
   ```
4. ローカルで `npx vercel link` を実行し、`.vercel/project.json` から ID を取得

### 3. GitHub

**Settings > Secrets and variables > Actions** に追加:

| Secret 名 | 取得方法 |
|---|---|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens で発行 |
| `VERCEL_ORG_ID` | `.vercel/project.json` の `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` の `projectId` |

**Settings > Environments** で `stg` environment を作成 (ワークフローが参照)。

## デプロイ運用

### 手動トリガー

GitHub Actions の "Deploy STG" から `workflow_dispatch` で手動実行可能。

### ロールバック

- **Vercel**: Deployments 画面で過去のデプロイを "Promote to Production"
- **Railway**: Deployments タブで過去のリリースを "Redeploy"

### ヘルスチェック

- バックエンド: `GET https://<Railway URL>/api/health`
- 失敗時は Railway が自動再起動 ([railway.json](../railway.json) の `restartPolicyType: ON_FAILURE`)

## 関連ファイル

- [railway.json](../railway.json) — Railway ビルド/起動設定
- [.github/workflows/deploy-stg.yml](../.github/workflows/deploy-stg.yml) — Vercel デプロイ
- [server/app.ts](../server/app.ts) — `process.env.PORT` / `/api/health`
