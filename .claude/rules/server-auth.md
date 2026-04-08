---
paths:
  - "server/middleware/**"
  - "server/routes/auth.ts"
  - "server/routes/shared/userContext.ts"
  - "client/utils/AuthContext.tsx"
---

# 認証実装ルール

## AWS Cognito 統合
- クライアント認証は AWS Amplify Auth を使用
- サーバーは JWT 検証のみ（`aws-jwt-verify`）
- `userContext.ts` は JWT の `sub` (UUID) からユーザーIDを取得
- 既存の DEMO_USER_ID フォールバックは認証ミドルウェア導入後に削除

## セキュリティ
- パスワードは Cognito が管理。サーバーに平文保存しない
- Authorization ヘッダーから Bearer トークンを取得
- トークン検証失敗時は 401 を返す
- 公開エンドポイント（`/api/v1/packs/public/:id`）は認証不要
