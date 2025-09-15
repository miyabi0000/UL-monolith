# API エンドポイント構成比較

## 📊 現状のAPI構成 vs 提案する新構成

### 🔍 現状の分析

現在のAPIエンドポイント構成を調査し、RESTful設計に基づく改善案を提案します。

## 🎯 ギア管理API

### 現状の構成

```
GET    /api/v1/gear                    # 全ギア取得（基本的な実装）
POST   /api/v1/gear                    # ギア作成
PUT    /api/v1/gear/:id                # ギア更新
DELETE /api/v1/gear/:id                # ギア削除
PATCH  /api/v1/gear/:id                # ギア部分更新
PATCH  /api/v1/gear/bulk               # バルク操作
GET    /api/v1/gear/:id/history        # 履歴取得
POST   /api/v1/gear/:id/revert/:historyId # 履歴復元
POST   /api/v1/gear/bulk-delete        # レガシー一括削除
```

### 🚀 提案する新構成

#### 基本CRUD操作
```
GET    /api/v1/gear                    # ギア一覧（フィルタ・ソート対応）
GET    /api/v1/gear/:id                # 特定ギア取得
POST   /api/v1/gear                    # 新規ギア作成
PUT    /api/v1/gear/:id                # ギア更新（全体）
PATCH  /api/v1/gear/:id                # ギア部分更新
DELETE /api/v1/gear/:id                # ギア削除
```

#### 検索・フィルタリング
```
GET /api/v1/gear?category=Clothing           # カテゴリ別フィルタ
GET /api/v1/gear?priority=1&season=all       # 複数条件フィルタ
GET /api/v1/gear?sort=weight&order=desc      # ソート
GET /api/v1/gear?page=1&limit=20             # ページネーション
GET /api/v1/gear?search=メリノ               # テキスト検索
```

#### 集計・分析
```
GET /api/v1/gear/summary                     # 総重量、総価格、不足数
GET /api/v1/gear/analytics/weight            # 重量分析（チャート用）
GET /api/v1/gear/analytics/category          # カテゴリ別集計
```

#### バルク操作
```
POST   /api/v1/gear/bulk                     # 一括作成
PUT    /api/v1/gear/bulk                     # 一括更新
DELETE /api/v1/gear/bulk                     # 一括削除（body: {ids: string[]})
```

## 📋 比較表

| 機能 | 現状 | 提案 | 改善点 |
|------|------|------|--------|
| **基本取得** | `GET /gear` | `GET /gear` | ✅ 同じ |
| **個別取得** | ❌ なし | `GET /gear/:id` | 🆕 追加 |
| **フィルタリング** | ❌ サーバー側未実装 | クエリパラメータ対応 | 🔥 大幅改善 |
| **ソート** | ❌ フロントエンド依存 | サーバー側実装 | 🔥 パフォーマンス向上 |
| **ページネーション** | ❌ なし | `page`, `limit`パラメータ | 🆕 スケーラビリティ |
| **検索** | ❌ なし | `search`パラメータ | 🆕 UX向上 |
| **集計データ** | ❌ フロントエンド計算 | `/summary` エンドポイント | 🔥 計算処理移行 |
| **分析データ** | ❌ フロントエンド計算 | `/analytics/*` エンドポイント | 🔥 チャート最適化 |
| **バルク削除** | `POST /bulk-delete` | `DELETE /bulk` | ✅ RESTful化 |

## 🎨 レスポンス形式の改善

### 現状のレスポンス
```json
{
  "success": true,
  "data": [...]
}
```

### 提案するレスポンス（ページネーション対応）
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "filters": {
    "category": "Clothing",
    "sort": "weight",
    "order": "desc"
  }
}
```

## 🔍 クエリパラメータ詳細

### フィルタリング
- `category`: カテゴリ名での絞り込み
- `priority`: 優先度（1-5）での絞り込み
- `season`: 季節での絞り込み
- `shortage`: 不足があるアイテムのみ (`shortage=true`)
- `owned`: 所持状況 (`owned=true/false`)

### ソート
- `sort`: ソートフィールド (`name`, `weight`, `priority`, `shortage`, `totalWeight`, `totalPrice`)
- `order`: ソート順 (`asc`, `desc`)

### ページネーション
- `page`: ページ番号（1から開始）
- `limit`: 1ページあたりのアイテム数（デフォルト: 20, 最大: 100）

### 検索
- `search`: 名前・ブランドでの部分一致検索

## 🚀 実装優先度

### Phase 1: 基本機能強化 🔥
1. ✅ `GET /gear/:id` - 個別取得
2. ✅ `GET /gear/summary` - 集計データ
3. 🔄 フィルタリング機能
4. 🔄 ソート機能

### Phase 2: 検索・分析 📊
1. テキスト検索機能
2. ページネーション
3. 分析エンドポイント

### Phase 3: バルク操作最適化 ⚡
1. RESTful バルク操作
2. バリデーション強化
3. エラーハンドリング改善

## 💡 メリット

### パフォーマンス向上
- サーバー側フィルタリング・ソートによるデータ転送量削減
- 計算処理のサーバー側実行
- ページネーションによる初期ロード高速化

### 開発効率向上
- RESTful設計による直感的なAPI
- 段階的実装による安全な移行
- 型安全なクライアント実装

### ユーザー体験向上
- 高速な検索・フィルタリング
- リアルタイムな集計データ
- 大量データでも快適な操作

## 🔄 移行計画

1. **段階的実装**: 既存APIを維持しながら新エンドポイントを追加
2. **並行運用**: 一定期間両方をサポート
3. **段階的移行**: フロントエンドを新APIに移行
4. **レガシー削除**: 旧エンドポイントの廃止

この設計により、スケーラブルで保守性の高いAPIアーキテクチャを実現できます。
