# STG 環境セットアップ

友達にテストしてもらう用のステージング環境。本番 (Railway) と完全に分離した DB / Cognito を持ち、決済機能は無効化、AI 機能は Pro 相当のクォータで使える。

## 構成

```
Railway Project (既存)
├── web-prod (本番) ──────► Postgres-prod ──► Cognito Pool (prod)
└── web-staging (新規) ───► Postgres-stg ───► Cognito Pool (stg)

本番と STG は以下を共有しない:
  - Database (別プラグイン)
  - Cognito User Pool (別 Pool)
  - Stripe (STG は未設定 / 決済無効)
  - OpenAI API Key (別キー推奨 / コスト分離)
```

## コード側の挙動

`APP_ENV` 環境変数で分岐する。`NODE_ENV=production` は STG でも設定する（SSL・認証挙動を本番と同じにするため）。

| 変数値 | バナー | 決済 | AI クォータ | robots.txt |
|---|---|---|---|---|
| `APP_ENV=development` | 非表示 | 通常 | users.plan 基準 | Allow |
| `APP_ENV=staging` | 黄色バナー表示 | 503 | 全員 Pro 扱い | Disallow |
| `APP_ENV=production` | 非表示 | 通常 | users.plan 基準 | Allow |

## 初期セットアップ手順 (1 回だけ)

### 1. Cognito User Pool (STG) を AWS で作成

- Pool 名: `ul-gear-manager-staging` など
- 自己サインアップ: 有効
- メール検証: 必須
- パスワードポリシー: 本番と同じ (大小英数記号 8 文字以上)
- App Client を作成、Client Secret は**なし** (SPA 向け)
- Callback URL に STG の Railway ドメインを登録（後述 #4 で確定したらここに戻って追加）

### 2. Railway に新 Postgres プラグインを追加

1. 既存プロジェクトで `+ New` → `Database` → `PostgreSQL`
2. 名前を `postgres-staging` 等にリネーム

### 3. Railway に STG 用 Web サービスを追加

1. `+ New` → `GitHub Repo` → `miyabi0000/UL-monolith`
2. サービス名を `web-staging` 等にリネーム
3. Settings → Deploy → Source Branch を `staging` に変更
4. Settings → Networking → Generate Domain で公開 URL を発行

### 4. STG サービスの環境変数を設定

`Variables` タブで以下を設定 (Railway は Postgres プラグインの内部 URL を `${{Postgres.DATABASE_URL}}` 形式で参照できる):

```
APP_ENV=staging
NODE_ENV=production
DATABASE_URL=${{postgres-staging.DATABASE_URL}}
COGNITO_USER_POOL_ID=<STG Pool ID>
COGNITO_CLIENT_ID=<STG Client ID>
OPENAI_API_KEY=<STG 用キー>
VITE_APP_ENV=staging
VITE_COGNITO_USER_POOL_ID=<STG Pool ID と同値>
VITE_COGNITO_CLIENT_ID=<STG Client ID と同値>
```

`STRIPE_*` は**設定しない** (決済無効化のため)。
`VITE_API_BASE_URL` は空のまま（同一オリジン配信）。

### 5. Cognito の Callback URL を更新

手順 3-4 で発行された STG ドメイン (`https://web-staging-xxxx.up.railway.app`) を Cognito App Client の Callback URL に追加する。

### 6. デプロイ

`staging` ブランチに push すれば Railway が自動デプロイする。

```bash
git checkout -b staging
git push -u origin staging
```

### 7. 動作確認

- `https://<staging-domain>/api/health` が `"appEnv":"staging"` を返す
- トップページに黄色い「STAGING ENVIRONMENT」バナーが出る
- サインアップ → メール検証 → ログインができる
- ギア登録・パック作成が動作
- AI アドバイザーが動作 (クォータで弾かれない)
- `/api/v1/billing/checkout` が 503 を返す
- `/robots.txt` が `Disallow: /` を含む

## 運用フロー

1. 機能ブランチ → `main` に PR マージ
2. 本番に出す前のお試しで `main` を `staging` にマージ
3. 友達に `https://<staging-domain>` を共有して触ってもらう
4. 問題なければそのまま本番リリース (main の最新を本番サービスが拾う)

## 友達への共有メッセージ例

```
UL Gear Manager の STG 環境を用意したので触ってみて。

URL: https://<staging-domain>

・右上のサインアップからメールで登録できる (本番とは別のアカウント)
・黄色い「STAGING」バーが出ていれば STG にいる証拠
・データはいつでも消える可能性があるので、大事なデータは入れないで
・決済機能は無効化してある (課金は発生しない)
・AI 機能は普通に使える

触ってみて気になったところや壊れたところを教えてほしい。
```

## スコープ外

- STG → 本番の DB 同期 (やらない: 機微データを本番に流したくないため)
- STG 用の独自カスタムドメイン (Railway 発行ドメインで十分)
- Stripe テストモード (今回は決済機能を完全 OFF)
