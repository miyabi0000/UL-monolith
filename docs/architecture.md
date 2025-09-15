# UL Gear List Manager - アーキテクチャ設計書

## 1. システム構成

### 1.1 全体アーキテクチャ
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ React/TypeScript│◄──►│ FastAPI/Python  │◄──►│ PostgreSQL/RDS  │
│ TailwindCSS     │    │ SQLAlchemy      │    │                 │
│ Shadcn/ui       │    │ Pydantic        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │  External APIs  │              │
         └──────────────►│                 │◄─────────────┘
                        │ OpenAI GPT-4o   │
                        │ AWS S3/CloudFront│
                        └─────────────────┘
```

### 1.2 技術スタック

#### フロントエンド
- **Framework**: React 18+ with TypeScript
- **Routing**: TanStack Router
- **UI**: Shadcn/ui + TailwindCSS
- **Charts**: Recharts
- **State**: React Hook Form + TanStack Query

#### バックエンド
- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.0 (async)
- **Validation**: Pydantic v2
- **Migration**: Alembic
- **Authentication**: JWT

#### データベース
- **Primary**: PostgreSQL 15+ on AWS RDS
- **Cache**: Redis (session/LLM cache)

#### インフラ
- **IaC**: AWS CDK
- **Compute**: AWS ECS/Fargate
- **Storage**: AWS S3
- **CDN**: AWS CloudFront

## 2. データベース設計

### 2.1 エンティティ関係図
上記のMermaid ERDを参照

### 2.2 主要テーブル仕様

#### USERS
- **目的**: ユーザー認証・管理
- **主キー**: UUID
- **制約**: email, username は一意

#### GEAR_ITEMS
- **目的**: ギア情報の中核テーブル
- **計算フィールド**: shortage, total_weight_grams
- **LLM連携**: extracted_data (JSONB), extraction_confidence

#### CATEGORIES
- **目的**: 階層カテゴリ管理
- **階層構造**: parent_id (自己参照), path (配列), depth
- **グローバル/ユーザー**: user_id NULL = グローバル

#### GEAR_LISTS
- **目的**: ギアリスト管理
- **用途別**: trip_type, season による分類

## 3. API設計

### 3.1 エンドポイント構成
```
/api/v1/
├── auth/
│   ├── POST /register
│   ├── POST /login
│   └── POST /refresh
├── gear/
│   ├── GET    /gear
│   ├── POST   /gear
│   ├── GET    /gear/{id}
│   ├── PUT    /gear/{id}
│   ├── DELETE /gear/{id}
│   └── POST   /gear/extract-from-url
├── categories/
│   ├── GET    /categories
│   ├── POST   /categories
│   └── GET    /categories/tree
├── lists/
│   ├── GET    /lists
│   ├── POST   /lists
│   ├── GET    /lists/{id}
│   ├── PUT    /lists/{id}
│   └── DELETE /lists/{id}
└── analytics/
    ├── GET /lists/{id}/chart-data
    └── GET /lists/{id}/stats
```

### 3.2 LLM抽出フロー
```
1. POST /gear/extract-from-url
   ├── URL validation
   ├── HTML scraping
   ├── LLM processing (GPT-4o)
   ├── Structured data extraction
   └── Confidence scoring

2. Response format:
   {
     "extracted_data": {...},
     "confidence": 0.85,
     "suggested_category": "...",
     "requires_review": true
   }
```

## 4. セキュリティ設計

### 4.1 認証・認可
- **認証**: JWT (Access + Refresh Token)
- **認可**: User-based resource access
- **セッション**: Redis-based token management

### 4.2 データ保護
- **通信**: HTTPS強制
- **パスワード**: bcrypt hashing
- **API**: Rate limiting
- **不明**: データ暗号化レベル

## 5. パフォーマンス設計

### 5.1 データベース最適化
- **インデックス**: user_id, category_path, created_at
- **パーティション**: **不明** (データ量次第)
- **クエリ最適化**: N+1問題対策

### 5.2 キャッシュ戦略
- **LLM結果**: Redis (7日間)
- **カテゴリツリー**: アプリケーションレベル
- **静的アセット**: CloudFront

### 5.3 スケーリング
- **水平**: ECS Auto Scaling
- **垂直**: RDS instance scaling
- **不明**: 具体的な閾値設定

## 6. 監視・運用

### 6.1 ログ設計
- **アプリケーション**: CloudWatch Logs
- **アクセス**: ALB Access Logs
- **エラー**: Structured logging (JSON)

### 6.2 メトリクス
- **システム**: CPU, Memory, Disk
- **アプリケーション**: Response time, Error rate
- **ビジネス**: User activity, LLM usage

### 6.3 アラート
- **不明**: 具体的な閾値・通知先

## 7. 開発・デプロイ

### 7.1 環境構成
```
Development  → Local Docker Compose
Staging      → AWS (不明: 具体的構成)
Production   → AWS (不明: 具体的構成)
```

### 7.2 CI/CD
- **不明**: パイプライン詳細
- **不明**: テスト戦略
- **不明**: デプロイ戦略

## 8. 制約・前提

### 8.1 技術制約
- PostgreSQL使用必須
- AWS環境での構築
- LLM API使用量制限: **不明**

### 8.2 運用制約
- **不明**: 可用性要件
- **不明**: バックアップ戦略
- **不明**: 災害復旧計画

## 9. 今後の課題

### 9.1 技術的課題
- LLM抽出精度の向上
- 大量データ処理の最適化
- リアルタイム更新機能

### 9.2 運用課題
- **不明**: サポート体制
- **不明**: 利用規約・プライバシーポリシー
- **不明**: 商用利用時のライセンス問題











