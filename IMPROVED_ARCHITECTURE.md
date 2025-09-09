# Improved Architecture - UL Gear Manager

## Avalabを参考にした改善されたディレクトリ構造

```
/Users/shimizumasaya/ULモノリス/
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .env.local
├── docs/                           # プロジェクト文書
│   ├── api/                       # API文書
│   │   ├── endpoints.md
│   │   ├── authentication.md
│   │   └── examples/
│   ├── deployment/                # デプロイ文書
│   │   ├── local-setup.md
│   │   └── production.md
│   ├── architecture.md            # アーキテクチャ概要
│   ├── requirements.md            # 要件定義
│   └── diagrams/                  # システム図
│       ├── database-schema.png
│       └── system-overview.png
├── res/                           # リソース（Avalab方式）
│   ├── client/                    # フロントエンド
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/    # Reactコンポーネント
│   │   │   │   │   ├── gear/
│   │   │   │   │   ├── category/
│   │   │   │   │   ├── chat/
│   │   │   │   │   ├── auth/
│   │   │   │   │   └── common/
│   │   │   │   ├── hooks/         # カスタムフック
│   │   │   │   ├── services/      # APIクライアント
│   │   │   │   ├── stores/        # 状態管理
│   │   │   │   ├── utils/         # ユーティリティ
│   │   │   │   └── types/         # TypeScript型定義
│   │   │   ├── routes/            # ページルート（SvelteKit風）
│   │   │   │   ├── dashboard/
│   │   │   │   ├── gear/
│   │   │   │   ├── categories/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │   ├── styles/            # スタイル
│   │   │   │   ├── globals.css
│   │   │   │   ├── components.css
│   │   │   │   └── variables.css
│   │   │   ├── assets/            # 静的アセット
│   │   │   └── data/              # 初期データ・モック
│   │   ├── public/                # 公開ファイル
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   ├── server/                    # バックエンド
│   │   ├── src/
│   │   │   ├── v1/                # APIバージョン管理
│   │   │   │   ├── controllers/   # APIコントローラー
│   │   │   │   │   ├── gear.controller.ts
│   │   │   │   │   ├── category.controller.ts
│   │   │   │   │   ├── llm.controller.ts
│   │   │   │   │   └── auth.controller.ts
│   │   │   │   ├── services/      # ビジネスロジック
│   │   │   │   │   ├── gearService.ts
│   │   │   │   │   ├── categoryService.ts
│   │   │   │   │   ├── llmService.ts
│   │   │   │   │   └── authService.ts
│   │   │   │   ├── models/        # データモデル
│   │   │   │   │   ├── gear.model.ts
│   │   │   │   │   ├── category.model.ts
│   │   │   │   │   └── user.model.ts
│   │   │   │   ├── routes/        # ルート定義
│   │   │   │   │   ├── gear.routes.ts
│   │   │   │   │   ├── category.routes.ts
│   │   │   │   │   ├── llm.routes.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── middleware/    # ミドルウェア
│   │   │   │       ├── auth.middleware.ts
│   │   │   │       ├── validation.middleware.ts
│   │   │   │       └── error.middleware.ts
│   │   │   ├── infra/             # インフラ統合
│   │   │   │   ├── database/
│   │   │   │   │   ├── connection.ts
│   │   │   │   │   └── migrations/
│   │   │   │   ├── llm/           # LLM API統合
│   │   │   │   │   ├── openai.ts
│   │   │   │   │   └── anthropic.ts
│   │   │   │   └── storage/       # ファイルストレージ
│   │   │   ├── utils/             # サーバーユーティリティ
│   │   │   │   ├── validation.ts
│   │   │   │   ├── sanitization.ts
│   │   │   │   └── logger.ts
│   │   │   ├── config/            # 設定
│   │   │   │   ├── database.ts
│   │   │   │   ├── server.ts
│   │   │   │   └── llm.ts
│   │   │   └── app.ts             # アプリケーションエントリー
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   ├── database/                  # データベース
│   │   ├── migrations/
│   │   ├── seeds/
│   │   ├── schema.sql
│   │   ├── docker-compose.db.yml
│   │   └── Dockerfile
│   └── infra/                     # インフラストラクチャ
│       ├── docker/                # Docker設定
│       │   ├── development/
│       │   └── production/
│       ├── nginx/                 # Nginx設定
│       │   ├── nginx.conf
│       │   └── ssl/
│       └── scripts/               # デプロイスクリプト
│           ├── deploy.sh
│           └── backup.sh
├── tools/                         # 開発ツール
│   ├── scripts/
│   │   ├── setup.sh
│   │   └── test.sh
│   └── generators/                # コード生成
└── tests/                         # テスト
    ├── unit/
    ├── integration/
    └── e2e/
```

## 主な改善点

### 1. **res/ ディレクトリによる明確な分離**
- Avalab方式を採用し、`res/client/`, `res/server/`, `res/database/` で完全分離
- 各コンポーネントが独立してビルド・デプロイ可能

### 2. **APIバージョン管理**
- `res/server/src/v1/` でAPIバージョンを管理
- 将来的なv2, v3への拡張が容易

### 3. **インフラ統合の明確化**
- `res/server/src/infra/` でLLM、データベース、ストレージ統合を管理
- 外部サービス依存を一箇所に集約

### 4. **スケーラブルなフロントエンド構造**
- `res/client/src/lib/` でライブラリ的コンポーネントを管理
- `res/client/src/routes/` でページ単位の構造化

### 5. **運用・保守の考慮**
- `docs/` でドキュメント体系を整備
- `tools/`, `tests/` で開発・テスト環境を整備
- Docker による環境統一

## 移行計画

1. **Phase 1**: res/ 構造への移行
2. **Phase 2**: インフラ統合の分離
3. **Phase 3**: APIバージョン管理の導入
4. **Phase 4**: テスト・文書体系の整備

## 利点

- **保守性**: 各コンポーネントが独立して変更可能
- **スケーラビリティ**: 機能追加時の影響範囲が限定的
- **チーム開発**: フロントエンド・バックエンドチームが並行作業可能
- **デプロイ**: コンポーネント単位でのデプロイが可能
- **テスト**: 各層で独立したテストが実施可能
