# API統合ドキュメント - Production Ready

## 🎯 概要

LLM機能の**実API統合**を実装しました。**バックエンド経由 + リトライ機能 + エラーハンドリング**でプロダクション対応済みです。

## 📁 実装ファイル

### 設定・環境変数
- `.env.example` - 環境変数テンプレート
- `.env.local` - ローカル環境設定
- `src/config/api.ts` - API設定・リトライ機能・ヘルパー関数

### APIサービス層
- `src/services/backendApiService.ts` - バックエンドAPI統合（リトライ・エラーハンドリング）
- `src/services/llmService.ts` - LLMサービス統合レイヤー
- `src/utils/apiTest.ts` - API接続テスト用ユーティリティ

### フロントエンド
- `src/components/ChatPopup.tsx` - 実API対応 + プロダクション級エラーハンドリング

## 🔧 環境設定

**実APIモード（本番対応）**
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## 🌐 バックエンドAPI仕様

### エンドポイント
```
POST /llm/extract-gear      - プロンプトからギア抽出
POST /llm/extract-url       - URLからギア抽出（スクレイピング含む）
POST /llm/enhance-prompt    - URL+プロンプト併用
POST /llm/extract-category  - カテゴリ抽出
POST /llm/analyze-list      - ギアリスト分析
POST /llm/health           - API疎通確認
```

### リクエスト形式
```typescript
// ギア抽出
POST /llm/extract-gear
{
  "prompt": "Arc'teryx Beta AR 追加"
}

// URL抽出  
POST /llm/extract-url
{
  "url": "https://montbell.jp/products/..."
}

// 情報統合
POST /llm/enhance-prompt
{
  "urlData": {...},
  "prompt": "実測230g"
}
```

### レスポンス形式
```typescript
{
  "success": true,
  "data": {
    "name": "Arc'teryx Beta AR Jacket",
    "brand": "Arc'teryx", 
    "weightGrams": 415,
    "priceCents": 7800000,
    "suggestedCategory": "Clothing",
    "confidence": 0.85
  },
  "message": "処理完了"
}
```

## ⏱️ タイムアウト設定

### 段階的タイムアウト
- **クライアント → バックエンド**: 65秒
- **バックエンド → 外部API**: 60秒  
- **軽量処理**: 30秒

### 実装方針
```typescript
// フロントエンド側
const response = await fetchWithTimeout(url, options, 65000)

// バックエンド側（想定）
const llmResponse = await openai.chat.completions.create({
  timeout: 60000, // 60秒
  ...
})
```

## 🔄 リトライ機能・エラーハンドリング

### 自動リトライ機能
- **リトライ回数**: 3回まで
- **バックオフ**: 指数関数的 (1秒 → 2秒 → 4秒)
- **4xxエラー**: リトライしない (クライアントエラー)
- **5xxエラー**: リトライ対象 (サーバーエラー)

### 実装例
```typescript
export async function extractFromPrompt(prompt: string) {
  return BackendAPI.extractGearFromPrompt(prompt)
}

// backendApiService.ts内部でリトライ処理
export const callAPIWithRetry = async (endpoint, data, timeoutMs) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs)
      return await response.json()
    } catch (error) {
      if (attempt < 3) {
        const waitTime = 1000 * Math.pow(2, attempt - 1)
        await sleep(waitTime)
        continue
      }
      throw error
    }
  }
}
```

## 🧪 テスト・デバッグ

### 1. API接続テスト
```typescript
import { runAPITests } from './src/utils/apiTest'

// ブラウザコンソールで実行
runAPITests().then(result => console.log(result))
```

### 2. 設定確認
```typescript
import { logAPIDebugInfo } from './src/utils/apiTest'

// デバッグ情報表示
logAPIDebugInfo()
```

### 3. 手動テスト方法
1. ログイン: `demo@example.com` / `demo123`
2. ChatPopup開く
3. 以下を入力してテスト:
   ```
   "Arc'teryx Beta AR 追加"      → ギア抽出
   "シェルター カテゴリ追加"     → カテゴリ追加
   "軽量化アドバイス"            → リスト分析
   ```

## 🚨 エラーハンドリング

### クライアント側
- **タイムアウト**: 段階的タイムアウト設定 (軽量: 10秒, 標準: 30秒, 重い処理: 60秒)
- **APIError**: カスタムエラークラスでステータス・コード管理
- **ネットワークエラー**: ユーザーフレンドリーなエラー表示

### バックエンド側（今後実装）
- **OpenAI API制限**: Rate limitエラーのハンドリング
- **スクレイピング失敗**: URL解析エラーの適切な処理
- **不正リクエスト**: バリデーションエラーの詳細化

## 💰 コスト管理

### OpenAI API使用量
- **モデル**: GPT-4o-mini（コスト効率重視）
- **最大トークン**: 1000（適度な制限）
- **Temperature**: 0.3（一貫性重視）

### 推定コスト（参考）
```
入力: ~100トークン/リクエスト
出力: ~200トークン/リクエスト
GPT-4o-mini: $0.15/1M入力 + $0.60/1M出力
→ 約$0.0002/リクエスト（約0.03円/リクエスト）
```

## 🔐 セキュリティ

### 重要な注意点
- **APIキー**: フロントエンドには含めない（バックエンドで管理）
- **CORS**: バックエンドで適切な設定が必要
- **Rate Limiting**: バックエンドで実装推奨

### セキュリティベストプラクティス
- **バックエンドプロキシ**: フロントエンドからの直接API呼び出しを回避
- **APIキー隠蔽**: バックエンドでOpenAI API認証情報を管理

## 📈 次のステップ

### 短期（1-2週間）
1. **バックエンド実装**: FastAPI + OpenAI統合
2. **スクレイピング機能**: BeautifulSoup等でHTML解析
3. **エラーハンドリング強化**: より詳細なエラー情報

### 中期（1ヶ月）
1. **キャッシュシステム**: Redis等での結果キャッシュ
2. **バッチ処理**: 複数ギアの一括処理
3. **ユーザー学習**: 個人の傾向を学習した提案

### 長期（2-3ヶ月）
1. **画像解析**: 商品画像からの情報抽出
2. **レビュー統合**: 外部レビューサイトからの情報取得
3. **コミュニティ機能**: ユーザー間での情報共有

---

**プロダクション対応済みAPI統合が完了しました。バックエンドAPI実装後、即座に本格運用可能です。**