# Docker + PostgreSQL セットアップガイド

## 🎯 概要

このプロジェクトではDocker ComposeでPostgreSQLを管理します。
データは永続化され、コンテナを削除しても保持されます。

## 📋 前提条件

- Docker Desktop がインストールされていること
- Node.js 18+ がインストールされていること

## 🚀 クイックスタート

### 1. 環境変数の設定

`.env`ファイルを作成（デフォルト値で動作します）：

```bash
# データベース設定（Dockerの設定と一致させる）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gear_manager
DB_USER=postgres
DB_PASSWORD=password

# OpenAI API設定（オプション）
OPENAI_API_KEY=your_openai_api_key_here

# サーバー設定
PORT=8000
NODE_ENV=development
```

### 2. PostgreSQLの起動

```bash
make db-up
```

または

```bash
docker-compose up -d postgres
```

**初回起動時**:
- PostgreSQL 15がダウンロードされます
- `init.sql`が自動実行されてテーブルが作成されます
- デフォルトカテゴリがインサートされます

### 3. 依存関係のインストール

```bash
npm install
```

### 4. アプリケーションの起動

```bash
# サーバーとクライアントを同時起動
make dev

# または個別に起動
npm run server:dev  # サーバー: http://localhost:8000
npm run dev         # クライアント: http://localhost:3001
```

## 📊 データベース管理

### データベース接続情報

```
Host: localhost
Port: 5432
Database: gear_manager
User: postgres
Password: password
```

### psqlで接続

```bash
make db-shell
```

または

```bash
docker-compose exec postgres psql -U postgres -d gear_manager
```

### よく使うSQLコマンド

```sql
-- テーブル一覧
\dt

-- テーブル構造確認
\d gear_items
\d categories

-- データ確認
SELECT * FROM gear_items;
SELECT * FROM categories;

-- データ件数確認
SELECT COUNT(*) FROM gear_items;

-- 全データ削除（開発用）
TRUNCATE gear_items RESTART IDENTITY CASCADE;
```

## 🛠️ pgAdmin（データベースGUI）

### 起動方法

```bash
make pgadmin
```

または

```bash
docker-compose --profile tools up -d pgadmin
```

### アクセス情報

- URL: http://localhost:5050
- Email: admin@example.com
- Password: admin

### サーバー接続設定（pgAdmin内）

1. 右クリック「Servers」→「Register」→「Server」
2. **General**タブ:
   - Name: `UL Gear Manager`
3. **Connection**タブ:
   - Host: `postgres` (Docker内ネットワーク名)
   - Port: `5432`
   - Database: `gear_manager`
   - Username: `postgres`
   - Password: `password`

## 🔄 データベース管理コマンド

### 起動・停止

```bash
# 起動
make db-up
docker-compose up -d postgres

# 停止
make db-down
docker-compose down

# 再起動
docker-compose restart postgres
```

### ログ確認

```bash
make db-logs
docker-compose logs -f postgres
```

### データリセット

```bash
# ⚠️ 全データが削除されます
make db-reset
```

または

```bash
docker-compose down -v  # ボリュームも削除
docker-compose up -d postgres
```

### データバックアップ

```bash
# ダンプ作成
docker-compose exec postgres pg_dump -U postgres gear_manager > backup.sql

# リストア
docker-compose exec -T postgres psql -U postgres gear_manager < backup.sql
```

## 📁 データ永続化

データは名前付きボリューム`postgres_data`に保存されます。

```bash
# ボリューム確認
docker volume ls | grep postgres

# ボリューム詳細
docker volume inspect ulモノリス_postgres_data

# ボリューム削除（⚠️ データ消失）
docker-compose down -v
```

## 🔍 トラブルシューティング

### ポートが既に使用されている

```bash
# ポート5432を使用中のプロセスを確認
lsof -ti:5432

# PostgreSQLが既に起動している場合
brew services stop postgresql  # Homebrewの場合
```

### コンテナが起動しない

```bash
# ログ確認
docker-compose logs postgres

# コンテナ状態確認
docker-compose ps

# 強制再起動
docker-compose down
docker-compose up -d postgres
```

### データベース接続エラー

```bash
# ヘルスチェック
docker-compose exec postgres pg_isready -U postgres

# 接続テスト
docker-compose exec postgres psql -U postgres -d gear_manager -c "SELECT 1"
```

### init.sqlが実行されない

初回起動時のみ実行されます。再実行する場合：

```bash
# ボリュームを削除して再起動
docker-compose down -v
docker-compose up -d postgres

# または手動実行
docker-compose exec -T postgres psql -U postgres -d gear_manager < server/database/init.sql
```

## 📊 パフォーマンス設定

### PostgreSQL設定のカスタマイズ

`docker-compose.yml`に追加：

```yaml
services:
  postgres:
    command:
      - "postgres"
      - "-c"
      - "max_connections=100"
      - "-c"
      - "shared_buffers=256MB"
```

## 🧪 開発ワークフロー

### 1. データベース起動

```bash
make db-up
```

### 2. スキーマ変更

1. `server/database/init.sql`を編集
2. データベースをリセット: `make db-reset`

### 3. アプリケーション起動

```bash
make dev
```

### 4. テスト実行

```bash
make test
```

## 📝 本番環境への移行

### 環境変数の更新

```bash
# 本番用の設定
DB_HOST=your-production-db-host
DB_PASSWORD=secure-random-password
NODE_ENV=production
```

### マイグレーション戦略

1. **Alembic** (Python)や**Knex.js** (Node.js)の導入を検討
2. バージョン管理されたマイグレーションファイルの作成
3. ロールバック機能の実装

## 🔐 セキュリティ

### 本番環境での注意点

1. **強力なパスワード**を使用
2. **環境変数**で機密情報を管理（`.env`をGitにコミットしない）
3. **SSL接続**を有効化
4. **ファイアウォール**でポート制限

## 📚 参考リンク

- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [Docker Compose公式ドキュメント](https://docs.docker.com/compose/)
- [pgAdmin公式ドキュメント](https://www.pgadmin.org/docs/)
