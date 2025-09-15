# 🚀 UL Gear List Manager - 起動ガイド

## 📋 前提条件チェック

### 必要なソフトウェア
```bash
# Node.js バージョン確認
node --version  # 18.0.0以上が必要

# npm バージョン確認
npm --version   # 9.0.0以上が必要
```

### 推奨環境
- **OS**: macOS 12+, Windows 10+, Ubuntu 20.04+
- **メモリ**: 4GB以上
- **ディスク**: 1GB以上の空き容量

## 🔧 セットアップ手順

### 1. プロジェクトクローン
```bash
# プロジェクトディレクトリに移動
cd ULモノリス

# 現在のディレクトリ確認
pwd
```

### 2. 依存関係インストール
```bash
# 既存のnode_modulesを削除（クリーンインストール）
rm -rf node_modules package-lock.json

# 依存関係をインストール
npm install
```

### 3. 開発サーバー起動
```bash
# 開発サーバーを起動
npm run dev
```

### 4. ブラウザでアクセス
- **URL**: http://localhost:5173/
- **推奨ブラウザ**: Chrome, Firefox, Safari, Edge

## 🎯 動作確認

### 正常起動の確認
```bash
# サーバーが起動しているか確認
curl -s http://localhost:5173/ | head -5

# 期待される出力
# <!doctype html>
# <html>
#   <head>
#     <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
```

### アプリケーション機能確認
1. **ダッシュボード表示**: サマリーカードが表示される
2. **ギアテーブル**: サンプルデータが表示される
3. **円グラフ**: 重量分析チャートが表示される
4. **ギア追加**: "+ Add Gear"ボタンが機能する

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 1. ポート5173が使用中
```bash
# 既存のViteプロセスを停止
pkill -f "vite"

# または別ポートで起動
npm run dev -- --port 3000
```

#### 2. 依存関係エラー
```bash
# 完全クリーンインストール
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 3. TypeScriptエラー
```bash
# 型チェック実行
npx tsc --noEmit

# 型定義の再生成
npm run build
```

#### 4. TailwindCSSが適用されない
```bash
# PostCSS設定確認
cat postcss.config.js

# TailwindCSS設定確認
cat tailwind.config.js
```

#### 5. モジュール解決エラー
```bash
# Vite設定確認
cat vite.config.ts

# ファイル存在確認
ls -la src/components/
```

## 🔄 再起動手順

### 開発サーバーの再起動
```bash
# 1. 既存プロセスを停止
pkill -f "vite"

# 2. 開発サーバーを再起動
npm run dev
```

### 完全リセット
```bash
# 1. すべてのプロセスを停止
pkill -f "node"
pkill -f "vite"

# 2. 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# 3. 開発サーバーを起動
npm run dev
```

## 📱 デバイス別アクセス

### ローカルネットワーク内の他のデバイスからアクセス
```bash
# ホストを指定して起動
npm run dev -- --host 0.0.0.0
```

### アクセスURL
- **ローカル**: http://localhost:5173/
- **ネットワーク**: http://[IPアドレス]:5173/

## 🛠️ 開発者向け情報

### ファイル監視
```bash
# ファイル変更の監視状況確認
# Viteが自動的にファイル変更を検知してホットリロード

# 手動リロード
# ブラウザで F5 または Cmd+R (Mac) / Ctrl+R (Windows)
```

### ログ確認
```bash
# 開発サーバーのログを確認
# ターミナルにリアルタイムでログが表示される

# エラーログの例
# [vite] Internal server error: Failed to resolve import...
```

### パフォーマンス確認
```bash
# ビルド時間確認
time npm run build

# バンドルサイズ確認
npm run build
ls -la dist/
```

## 📊 動作環境

### テスト済み環境
- **macOS**: 14.0 (M1/M2)
- **Windows**: 11 (x64)
- **Ubuntu**: 22.04 LTS
- **Node.js**: 18.17.0, 20.5.0
- **npm**: 9.6.7, 10.2.0

### ブラウザ対応
- **Chrome**: 100+
- **Firefox**: 100+
- **Safari**: 15+
- **Edge**: 100+

## 🔒 セキュリティ注意事項

### 開発環境
- 開発サーバーは本番環境では使用しない
- ファイアウォールでポート5173を制限することを推奨
- 機密情報は環境変数で管理

### 本番デプロイ
```bash
# 本番用ビルド
npm run build

# 静的ファイルの配信
npm run preview
```

## 📞 サポート

### 問題が解決しない場合
1. **ログ確認**: ターミナルのエラーメッセージを確認
2. **環境確認**: Node.js、npmのバージョンを確認
3. **依存関係確認**: package.jsonの内容を確認
4. **ファイル確認**: 必要なファイルが存在するか確認

### 緊急時の対処法
```bash
# 完全リセット
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

---

**最終更新**: 2024年8月  
**バージョン**: 1.0.0











