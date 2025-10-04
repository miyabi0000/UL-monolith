.PHONY: help db-up db-down db-logs db-reset install dev test

# デフォルトターゲット
help:
	@echo "==========================================
	@echo "🗄️  UL Gear Manager - Database Commands"
	@echo "=========================================="
	@echo ""
	@echo "📦 セットアップ:"
	@echo "  make install     - 依存関係をインストール"
	@echo ""
	@echo "🐘 PostgreSQL管理:"
	@echo "  make db-up       - PostgreSQLを起動"
	@echo "  make db-down     - PostgreSQLを停止"
	@echo "  make db-logs     - PostgreSQLのログを表示"
	@echo "  make db-reset    - データベースをリセット"
	@echo "  make db-shell    - PostgreSQLシェルに接続"
	@echo ""
	@echo "🚀 開発:"
	@echo "  make dev         - サーバー＋クライアント起動"
	@echo "  make dev-server  - サーバーのみ起動"
	@echo "  make dev-client  - クライアントのみ起動"
	@echo ""
	@echo "🧪 テスト:"
	@echo "  make test        - APIテストを実行"
	@echo ""
	@echo "🛠️  ツール:"
	@echo "  make pgadmin     - pgAdminを起動 (http://localhost:5050)"
	@echo "=========================================="

# 依存関係のインストール
install:
	npm install

# PostgreSQL起動
db-up:
	docker-compose up -d postgres
	@echo "⏳ PostgreSQLの起動を待機中..."
	@sleep 5
	@echo "✅ PostgreSQL起動完了！"
	@echo "   接続情報: postgresql://postgres:password@localhost:5432/gear_manager"

# PostgreSQL停止
db-down:
	docker-compose down

# PostgreSQLログ表示
db-logs:
	docker-compose logs -f postgres

# データベースリセット
db-reset:
	@echo "⚠️  データベースをリセットします..."
	docker-compose down -v
	docker-compose up -d postgres
	@sleep 5
	@echo "✅ データベースリセット完了！"

# PostgreSQLシェル接続
db-shell:
	docker-compose exec postgres psql -U postgres -d gear_manager

# pgAdmin起動
pgadmin:
	docker-compose --profile tools up -d pgadmin
	@echo "✅ pgAdmin起動完了！"
	@echo "   URL: http://localhost:5050"
	@echo "   Email: admin@example.com"
	@echo "   Password: admin"

# サーバー起動
dev-server:
	npm run server:dev

# クライアント起動
dev-client:
	npm run dev

# サーバー＋クライアント起動（並列）
dev:
	@echo "🚀 サーバーとクライアントを起動中..."
	@make -j2 dev-server dev-client

# APIテスト実行
test:
	@echo "🧪 APIテストを実行中..."
	./test-api.sh
