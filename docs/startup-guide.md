# 🚀 UL Gear Manager - 起動ガイド

## 📋 前提条件

### 必要なソフトウェア
- **Docker Desktop**: データベース管理に使用
- **Node.js**: 18.0.0以上
- **npm**: 9.0.0以上

バージョン確認:
```bash
node --version
npm --version
docker --version
```

## 🚀 起動手順

### 1. Dockerでデータベースを起動

```bash
# Docker Desktopを起動（GUIから起動）
open -a Docker

# PostgreSQLコンテナを起動
docker compose up -d postgres

# 起動確認
docker compose ps
```

**初回起動時**: データベースが自動的に初期化され、テーブルとデフォルトカテゴリが作成されます。

### 2. 依存関係のインストール

```bash
npm install
```

### 3. アプリケーションの起動

```bash
# バックエンドサーバー（別ターミナル）
npm run server:dev  # http://localhost:8000

# フロントエンドクライアント
npm run dev  # http://localhost:3001
```

### 4. ブラウザでアクセス

- **フロントエンド**: http://localhost:3001
- **バックエンドAPI**: http://localhost:8000/api/health

## 📊 データベース管理

### 接続情報
```
Host: localhost
Port: 5433
Database: gear_manager
User: postgres
Password: password
```

### psqlで接続
```bash
docker compose exec postgres psql -U postgres -d gear_manager
```

### よく使うコマンド
```bash
# コンテナ起動
docker compose up -d postgres

# コンテナ停止
docker compose down

# ログ確認
docker compose logs -f postgres

# データベースリセット（全データ削除）
docker compose down -v
docker compose up -d postgres
```

## 🐛 トラブルシューティング

### データベース接続エラー

**症状**: `ECONNREFUSED ::1:5433` エラー

**解決方法**:
```bash
# 1. Dockerが起動しているか確認
docker compose ps

# 2. PostgreSQLコンテナを起動
docker compose up -d postgres

# 3. バックエンドサーバーを再起動
# サーバーのターミナルでCtrl+Cして再実行
npm run server:dev
```

### ポート競合エラー

**症状**: ポート5433が既に使用中

**解決方法**:
```bash
# 使用中のプロセスを確認
lsof -ti:5433

# Homebrewのpostgresqlを停止
brew services stop postgresql
```

### コンテナが起動しない

```bash
# ログを確認
docker compose logs postgres

# 完全リセット
docker compose down -v
docker compose up -d postgres
```

## 🔄 日常の開発フロー

### 1. 開発開始時
```bash
# Docker起動（必要な場合）
docker compose up -d postgres

# サーバー起動（別々のターミナル）
npm run server:dev
npm run dev
```

### 2. 開発終了時
```bash
# サーバーを停止（Ctrl+C）

# Dockerコンテナ停止（オプション - 次回も使う場合は停止不要）
docker compose down
```

## 📝 環境変数

`.env`ファイル（プロジェクトルート）:
```bash
# データベース設定
DB_HOST=localhost
DB_PORT=5433
DB_NAME=gear_manager
DB_USER=postgres
DB_PASSWORD=password

# OpenAI API（オプション）
OPENAI_API_KEY=your_key_here

# サーバー設定
PORT=8000
NODE_ENV=development
```

## 🔐 セキュリティ

- `.env`ファイルはGitにコミットしない（`.gitignore`に含まれています）
- 本番環境では強力なパスワードを使用
- ポート5433は開発環境でのみ使用

---

**困ったときは**:
1. Docker Desktopが起動しているか確認
2. `docker compose ps`でPostgreSQLコンテナの状態を確認
3. サーバーを再起動してデータベース接続を再試行

