# UL Gear List Manager

UL（ウルトラライト）志向のミニマリスト向けギア管理システム

## 🚀 クイックスタート

### 前提条件
- Node.js 18.0.0 以上
- npm 9.0.0 以上

### インストール
```bash
# 依存関係をインストール
npm install
```

### 開発サーバー起動
```bash
# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:5173/ にアクセスしてください。

### ビルド
```bash
# 本番用ビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

## 📁 プロジェクト構成

```
ULモノリス/
├── src/
│   ├── pages/
│   │   └── App.tsx              # メインアプリケーション
│   ├── components/
│   │   ├── GearTable.tsx        # ギアテーブル（ソート・フィルタ）
│   │   ├── GearChart.tsx        # 階層型円グラフ
│   │   └── GearForm.tsx         # ギア追加・編集フォーム
│   ├── types/
│   │   └── index.ts             # TypeScript型定義
│   ├── data/
│   │   └── seedGear.json        # サンプルデータ
│   ├── styles.css               # TailwindCSS
│   └── main.tsx                 # エントリーポイント
├── docs/
│   ├── requirements.md          # 要件定義書
│   ├── architecture.md          # アーキテクチャ設計書
│   └── simplified-schema.sql    # データベーススキーマ
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🎯 主要機能

### 📊 ダッシュボード
- **サマリーカード**: 総アイテム数、総重量、総コスト、不足アイテム数
- **レスポンシブレイアウト**: デスクトップ・タブレット・モバイル対応

### 📋 ギア管理
- **テーブル表示**: ソート・フィルタ機能付き
- **カテゴリ分類**: 階層型カテゴリシステム
- **重量分析**: 各アイテムの重量比率表示

### 📈 重量分析チャート
- **階層型円グラフ**: 外側（カテゴリ）→ 内側（アイテム詳細）
- **インタラクティブ**: クリックで詳細表示切り替え
- **中央表示**: 総重量 + 選択カテゴリ名

### ➕ ギア追加・編集
- **URL自動抽出**: 商品URLからのモック抽出機能
- **フォームバリデーション**: 必須項目チェック
- **モーダル表示**: オーバーレイでの編集画面

## 🛠️ 技術スタック

### フロントエンド
- **React 18** + TypeScript
- **Vite** - 高速ビルドツール
- **TailwindCSS** - ユーティリティファーストCSS
- **Recharts** - データ可視化ライブラリ

### 開発ツール
- **TypeScript** - 型安全な開発
- **PostCSS** - CSS処理
- **ESLint** - コード品質管理

## 📊 データ構造

### ギアアイテム（9項目）
```typescript
interface GearItem {
  id: string;
  name: string;              // 製品名
  brand?: string;            // ブランド
  productUrl?: string;       // 商品URL
  requiredQuantity: number;  // 必要数
  ownedQuantity: number;     // 所持数
  weightGrams?: number;      // 単体重量(g)
  priceCents?: number;       // 価格(円)
  season?: string;           // 季節
  priority: number;          // 優先度(1-5)
}
```

### 計算フィールド
- `shortage`: 不足数（必要数 - 所持数）
- `totalWeight`: 総重量（単体重量 × 必要数）

## 🎨 UI/UX 特徴

### デザイン原則
- **ミニマル**: UL志向に合わせたシンプルなデザイン
- **直感的**: 一目で分かる重量分析
- **レスポンシブ**: 全デバイス対応

### 色分けシステム
- **Clothing**: #FF6B6B (赤)
- **Sleep**: #4ECDC4 (青緑)
- **Pack**: #FFE66D (黄色)
- **Electronics**: #4D96FF (青)
- **Hygiene**: #A66DFF (紫)

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# ビルド結果プレビュー
npm run preview

# 依存関係インストール
npm install

# 依存関係更新
npm update
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. ポートが使用中
```bash
# 既存プロセスを停止
pkill -f "vite"

# または別ポートで起動
npm run dev -- --port 3000
```

#### 2. 依存関係エラー
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 3. TypeScriptエラー
```bash
# 型チェック
npx tsc --noEmit
```

## 📝 今後の開発予定

### Phase 1: バックエンド統合
- [ ] FastAPI サーバー構築
- [ ] PostgreSQL データベース接続
- [ ] LLM 自動抽出機能実装

### Phase 2: 機能拡張
- [ ] ユーザー認証システム
- [ ] ギアリスト共有機能
- [ ] 印刷・エクスポート機能

### Phase 3: 高度な分析
- [ ] 季節別重量分析
- [ ] コスト効率分析
- [ ] 重量削減提案機能

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. Fork する
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

---

**開発者**: UL Gear List Team  
**最終更新**: 2024年8月










