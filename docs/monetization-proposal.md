# UL Gear Manager マネタイズ提案書

> 作成日: 2026-04-08
> ステータス: 提案段階

**サービス概要**: ハイカー・バックパッカー・登山者向けのギア管理サービス。自分のギアをAIで最適化し、パックリストを作成して共有できる。

---

## 1. 現状分析

### 1.1 現在の機能一覧（すべて無料提供中）

| カテゴリ | 機能 | 概要 |
|---------|------|------|
| ギア管理 | CRUD | ギアの登録・編集・削除・一覧表示 |
| ギア管理 | 重量トラッキング | Base/Worn/Consumable分類、UL判定 |
| ギア管理 | 調達管理 | 必要数 vs 所持数、不足数の自動計算 |
| AI | URL抽出 | 商品URLからギア情報を自動取得（OpenAI + スクレイピング） |
| AI | 一括URL取り込み | 複数URLの一括登録 |
| AI | テキスト抽出 | 自由テキストからギア情報を抽出 |
| AI | AIアドバイザー | ギアリストを分析し軽量化を提案 |
| 分析 | チャート | ドーナツ/バーチャート、カテゴリ別分析 |
| 分析 | 重量ブレークダウン | Base Weight/Worn Weight/Consumable の内訳 |
| 分析 | ギア比較 | 最大4アイテムの横並び比較 |
| 計画 | パック管理 | トリップ別パッキングリスト作成 |
| 計画 | 公開共有 | パックの公開リンク生成 |
| その他 | カテゴリ管理 | 階層型・色分け・Big3対応 |
| その他 | プロフィール | 名前・自己紹介・ヘッダー画像 |
| その他 | ダークモード | テーマ切り替え |

### 1.2 コスト構造

#### OpenAI API コスト詳細（gpt-4o、2026年4月時点）

| API 操作 | 入力トークン (平均) | 出力トークン (平均) | 1回あたりコスト | 備考 |
|---------|-------------------|-------------------|---------------|------|
| URL抽出 (`extractGearFromUrl`) | ~1,500 (system+scraped HTML) | ~500 | **~$0.008** (~1.2円) | スクレイピング結果をプロンプトに含む |
| テキスト抽出 (`extractGearFromPrompt`) | ~800 | ~500 | **~$0.005** (~0.8円) | URLなし、テキストのみ |
| プロンプト補完 (`enhanceWithPrompt`) | ~1,200 | ~400 | **~$0.006** (~0.9円) | URL抽出結果+ユーザー補足 |
| AIアドバイザー (`handleAdvisorChat`) | ~2,000 (gear context+history) | ~1,500 (max) | **~$0.020** (~3.0円) | max_tokens=1500、会話履歴込み |
| カテゴリ推定 (`extractCategory`) | ~500 | ~100 | **~$0.002** (~0.3円) | 軽量な分類タスク |

> 算出根拠: gpt-4o 料金 = 入力 $2.50/1M tokens、出力 $10.00/1M tokens（2026年4月時点）
> temperature: 0.1（抽出系）、0.3（アドバイザー）

#### ユーザーあたり月間コスト試算

| ユーザータイプ | 月間操作回数（想定） | 月間APIコスト |
|-------------|-------------------|-------------|
| ライトユーザー（月1-2回利用） | URL抽出2回 + アドバイザー3回 | **~$0.08** (~12円) |
| 通常ユーザー（週1回利用） | URL抽出8回 + アドバイザー10回 + テキスト抽出5回 | **~$0.29** (~44円) |
| ヘビーユーザー（ほぼ毎日） | URL抽出30回 + アドバイザー30回 + 一括取込20回 | **~$1.04** (~156円) |

#### インフラコスト

| コスト項目 | 月額 | 備考 |
|-----------|------|------|
| Vercel (Hobby) | $0 | 現在。ユーザー増で Pro 移行時 $20/月 |
| Vercel (Pro) | $20 | 商用利用・カスタムドメイン必須時 |
| PostgreSQL (Supabase Free) | $0 | 500MB、50,000行まで |
| PostgreSQL (Supabase Pro) | $25/月 | 8GB、無制限行 |
| AWS Cognito | $0〜 | 50,000 MAU まで無料。超過分 $0.0055/MAU |
| ドメイン | ~$12/年 (~$1/月) | |
| **合計（初期）** | **$0〜1/月** | Free tier 範囲内 |
| **合計（成長期 1,000+ users）** | **$45〜50/月** | Vercel Pro + Supabase Pro |

#### コストまとめ

```
月間総コスト = (ユーザー数 × 平均APIコスト/人) + インフラ固定費

例: 500ユーザー（平均$0.15/人）の場合
  API: 500 × $0.15 = $75/月
  インフラ: $45/月
  合計: $120/月 (~18,000円)

例: 2,000ユーザー（平均$0.12/人、Free多め）の場合
  API: 2,000 × $0.12 = $240/月
  インフラ: $50/月
  合計: $290/月 (~43,500円)
```

### 1.3 ターゲットユーザー

- **主要層**: 世界のハイカー・バックパッカー・登山者
- **コア層**: UL（ウルトラライト）ハイカー — 最も重量最適化ニーズが高く、ツールへの課金意欲がある
- **拡大層**: 一般的なバックパッカー・登山者 — パックリスト作成・共有ニーズ
- **初期市場**: 日本（開発元）、北米（UL/バックパッキングコミュニティ最大）、ヨーロッパ
- **特性**: 重量にこだわる、ギア選定に時間をかける、コミュニティ意識が強い
- **市場規模**:
  - ULハイカー: r/Ultralight 40万人超
  - バックパッカー全体: r/backpacking 250万人超、r/CampingGear 70万人超
  - 登山者: r/Mountaineering 20万人超
  - **潜在ユーザー: 数百万人規模**
- **利用パターン**: シーズン前に集中的にギア選定（北半球: 春・秋）
- **グローバル展開の前提条件**:
  - 重量単位の切り替え（g / oz）対応 — **必須**
  - 多通貨対応（JPY / USD / EUR）
  - UI の多言語化（最低限 日本語 / 英語）

### 1.4 競合との差別化

| 比較項目 | UL Gear Manager | LighterPack | PackWizard |
|---------|----------------|-------------|------------|
| AI自動登録 | **対応（URL/テキスト）** | 非対応 | 非対応 |
| AIアドバイザー | **対応** | 非対応 | 非対応 |
| 一括URL取り込み | **対応** | 非対応 | 非対応 |
| 多言語対応 | 日本語（英語対応予定） | 英語のみ | 英語のみ |
| 重量単位 | g のみ（**oz対応必須**） | g / oz / kg / lb | g / oz |
| 収益モデル | なし（**要実装**） | なし（完全無料/OSS） | アフィリエイト |

**差別化ポイント**: 
- **AIでギアを最適化** — URLを貼るだけで重量・価格を自動取得、AIが軽量化を提案
- **パックリストを共有** — 公開パックでトリップのギア構成をシェア

---

## 2. マネタイズ戦略

### 2.1 収益モデル概要

Free + Pro の2プラン構成。

```
┌─────────────────────────────────────────────────────┐
│  Free（無料）                                        │
│  基本機能すべて + AI制限あり                           │
├─────────────────────────────────────────────────────┤
│  Pro（980円/$6.99 月額）                              │
│  AI無制限 + CSV/PDFエクスポート                        │
└─────────────────────────────────────────────────────┘
```

### 2.2 プラン詳細

| 機能 | Free | Pro |
|------|------|-----|
| ギアCRUD | 無制限 | 無制限 |
| パック管理・共有 | 無制限 | 無制限 |
| チャート・分析 | 全機能 | 全機能 |
| ギア比較 | 全機能 | 全機能 |
| URL抽出 | **5回/月** | **無制限** |
| 一括URL取り込み | **3バッチ/月 (各3URL)** | **無制限** |
| AIアドバイザー | **10メッセージ/月** | **無制限** |
| CSV/PDFエクスポート | - | 対応 |

### 2.3 価格設定

| プラン | JPY (月額) | USD (月額) | JPY (年額) | USD (年額) |
|-------|-----------|-----------|-----------|-----------|
| Free | 0円 | $0 | 0円 | $0 |
| Pro | 980円 | $6.99 | 9,800円 | $69.99 |

#### 価格の根拠

| 根拠 | 詳細 |
|------|------|
| コスト回収 | ヘビーユーザーのAPIコスト ~$1.04/月をカバーし、十分な粗利を確保 |
| 競合比較 | AllTrails Plus $36/年 ($3/月)、Strava $12/月、Gaia GPS $40/年 ($3.3/月)。アウトドアアプリの相場$3〜12/月の中間帯 |
| 心理的価格 | ULハイカーの月間ギア支出（数千〜数万円）に対して十分に安い |
| 参考感覚 | ランチ1回分 / Netflix 基本プラン相当 |

### 2.4 将来検討: アフィリエイト（今回スコープ外）

ローンチ後にユーザー基盤ができてから検討する。2つのモデルが候補:

1. **プラットフォームアフィリエイト** — 全ユーザーの商品リンクにプラットフォームのタグ付与。パッシブ収益。
2. **Pro + Affiliate プラン** — Proの上位プラン。ユーザーが自分のAmazon AssociatesタグをPublicPackで使える。AAWP/Lasso等のSaaSモデルと同構造。

詳細設計はローンチ後に別途作成。

---

## 3. 収益シミュレーション

### 3.1 シナリオA: 500ユーザー（ローンチ6ヶ月後）

**前提**: 日本中心、グローバル展開初期

| 項目 | 内訳 | 月額収益 |
|------|------|---------|
| Free | 400人 (80%) | $0 |
| Pro | 100人 (20%) | $699 (~105,000円) |
| **売上合計** | | **$699/月 (~105,000円)** |

| コスト項目 | 算出根拠 | 月額コスト |
|-----------|---------|----------|
| OpenAI API | Free 400人×$0.05 + Pro 100人×$0.30 = $50 | -$50 |
| Cognito | 500 MAU（無料枠内） | $0 |
| Vercel Pro | 商用利用 | -$20 |
| PostgreSQL (Supabase Pro) | | -$25 |
| 決済手数料 | Stripe: ~$24 / Paddle: ~$85 (5%+$0.50×100件) | -$24〜85 |
| **コスト合計** | | **-$119〜180/月** |
| **純収益** | | **$519〜580/月 (~78,000〜87,000円)** |

### 3.2 シナリオB: 2,000ユーザー（ローンチ12ヶ月後）

**前提**: グローバル展開後、北米ユーザー増加

| 項目 | 内訳 | 月額収益 |
|------|------|---------|
| Free | 1,500人 (75%) | $0 |
| Pro | 500人 (25%) | $3,495 (~524,000円) |
| **売上合計** | | **$3,495/月 (~524,000円)** |

| コスト項目 | 算出根拠 | 月額コスト |
|-----------|---------|----------|
| OpenAI API | Free 1,500×$0.04 + Pro 500×$0.25 = $185 | -$185 |
| Cognito | 2,000 MAU（無料枠内） | $0 |
| Vercel Pro | | -$20 |
| PostgreSQL | | -$25 |
| 決済手数料 | Stripe: ~$112 / Paddle: ~$425 (5%+$0.50×500件) | -$112〜425 |
| **コスト合計** | | **-$342〜655/月** |
| **純収益** | | **$2,840〜3,153/月 (~426,000〜473,000円)** |

### 3.3 シナリオC: 10,000ユーザー（ローンチ24ヶ月後）

| 項目 | 内訳 | 月額収益 |
|------|------|---------|
| Free | 7,000人 (70%) | $0 |
| Pro | 3,000人 (30%) | $20,970 |
| **売上合計** | | **$20,970/月 (~3,146,000円)** |
| OpenAI API | 7,000×$0.03 + 3,000×$0.20 = $810 | -$810 |
| インフラ + 決済手数料 | Stripe: ~$700 / Paddle: ~$1,550 | -$700〜1,550 |
| **純収益** | | **$18,610〜19,460/月 (~2,792,000〜2,919,000円)** |

### 3.4 損益分岐点

```
月間固定コスト: $45（Vercel Pro + Supabase Pro）

【Stripe の場合】
  Pro 1人あたり粗利: $6.99 - $0.25(API) - $0.22(手数料) = $6.52
  損益分岐: $45 ÷ $6.52 = 7人
  → 登録ユーザー50人 × 14%課金率 = 7人で到達

【Paddle の場合】
  Pro 1人あたり粗利: $6.99 - $0.25(API) - $0.85(手数料5%+$0.50) = $5.89
  損益分岐: $45 ÷ $5.89 = 8人
  → 登録ユーザー57人 × 14%課金率 = 8人で到達

※ Paddle は手数料が高いが、MoR(税務代行)を含むため
  税理士費用やVAT登録コストが不要。実質コストは同等。
```

---

## 4. 必要な実装の詳細

### 前提: 現在の技術的状況

| 項目 | 現状 | 必要な対応 |
|------|------|----------|
| 認証 | モック（ハードコードされたデモユーザー） | AWS Cognito 導入 |
| 決済 | なし | Stripe 連携 |
| 使用量管理 | IP ベースのレートリミットのみ | ユーザー単位の使用量トラッキング |
| 重量単位 | グラムのみ（`weight_grams` カラム） | **g/oz 切り替え対応（必須）** |
| 多言語 | 日本語のみ | 英語対応（最低限） |
| アフィリエイト | なし | 将来検討（スコープ外） |

### Phase 0: グローバル対応の前提実装（1〜2週間）

#### 0-1: 重量単位 g/oz 切り替え（必須）

**現状**: DB は `weight_grams` (INTEGER) で保存。スクレイピング時に oz→g 変換済み（`server/utils/scrapingHelpers.ts`）。UI は全箇所グラム固定。

**方針**: DB はグラム保存のまま、表示層で変換する。

```typescript
// client/utils/weightUnit.ts（新規作成）

export type WeightUnit = 'g' | 'oz';

export function convertWeight(grams: number, unit: WeightUnit): number {
  if (unit === 'oz') return Math.round(grams / 28.3495 * 100) / 100;
  return grams;
}

export function formatWeight(grams: number, unit: WeightUnit): string {
  const value = convertWeight(grams, unit);
  return unit === 'oz' ? `${value} oz` : `${value} g`;
}

export function parseWeightInput(value: number, unit: WeightUnit): number {
  if (unit === 'oz') return Math.round(value * 28.3495);
  return value;
}
```

**変更対象ファイル**:

| ファイル | 変更内容 |
|---------|---------|
| `client/utils/weightUnit.ts` | 新規 — 変換・フォーマット関数 |
| `client/utils/formatters.ts` | 既存の `formatWeight` を単位対応に拡張 |
| `client/components/GearTable/EditableFields.tsx` | 重量入力フィールドに単位切り替え対応 |
| `client/components/gear-input/GearInputModal.tsx` | Weight (grams) → Weight (g/oz) に変更 |
| `client/components/GearForm.tsx` | 同上 |
| `client/components/WeightBreakdownCard.tsx` | 表示単位の切り替え |
| `client/components/ComparisonTable.tsx` | 比較表の単位対応 |
| `client/components/ProfileHeader.tsx` | 単位設定トグル追加 |

#### 0-2: 多言語対応（最低限 日本語/英語）

`react-i18next` 導入。初期は UI ラベルのみ。詳細設計は別ドキュメントに切り出し。

### Phase 1: 認証基盤 — AWS Cognito（1〜2週間）

#### 概要
モック認証を AWS Cognito に置き換える。既に `AuthContext.tsx` に Cognito のパスワードバリデーションコードが残っており、導入は想定済み。

#### AWS Cognito を選択する理由
- 50,000 MAU まで無料（コスト試算に組み込み済み）
- `AuthContext.tsx` に既存の Cognito パスワードバリデーションあり（移行コストが最小）
- メール/パスワード、Google/Apple OAuth 対応
- JWT (ID Token) を自動発行 → Express ミドルウェアで検証可能
- AWS Amplify ライブラリで React 統合が容易

#### 実装詳細

```
AWS Cognito User Pool 設定:
  - サインアップ: メール + パスワード
  - MFA: オプション（SMS or TOTP）
  - OAuth: Google, Apple（将来追加可）
  - JWT 有効期限: ID Token 1h, Refresh Token 30d
```

```typescript
// server/middleware/cognitoAuth.ts（新規作成）

import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export async function cognitoAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = await verifier.verify(token);
    req.userId = payload.sub;  // Cognito User ID (UUID)
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `client/utils/AuthContext.tsx` | Amplify Auth に置き換え（既存の Cognito バリデーション活用） |
| `server/middleware/cognitoAuth.ts` | 新規 — JWT 検証ミドルウェア（`aws-jwt-verify`） |
| `server/routes/shared/userContext.ts` | Cognito JWT の `sub` からユーザーIDを取得 |
| `server/routes/auth.ts` | モック実装を削除。Cognito はクライアント側で直接認証するため、サーバーは JWT 検証のみ |
| `server/app.ts` | `cognitoAuth` ミドルウェアをグローバルに適用 |

#### 環境変数（追加）

```
COGNITO_USER_POOL_ID=ap-northeast-1_XXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=ap-northeast-1
```

#### 既存データの移行
現在のギアデータは `DEMO_USER_ID` に紐づいている。初回サインアップユーザーに既存データを引き継ぐマイグレーションスクリプトが必要。

### Phase 2: 使用量トラッキング＋制限（1週間）

#### 新規テーブル

```sql
-- ユーザーの月間AI使用量
CREATE TABLE user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  feature VARCHAR(50) NOT NULL,  -- 'url_extract', 'bulk_import', 'advisor_chat', 'prompt_extract'
  period VARCHAR(7) NOT NULL,    -- 'YYYY-MM' 形式
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature, period)
);

CREATE INDEX idx_user_usage_lookup ON user_usage(user_id, period);

-- サブスクリプション管理
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',  -- 'free', 'pro'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

```

#### プラン別制限値

```typescript
const PLAN_LIMITS = {
  free: { url_extract: 5,  bulk_import: 9,  advisor_chat: 10, prompt_extract: 5 },
  pro:  { url_extract: -1, bulk_import: -1, advisor_chat: -1, prompt_extract: -1 },
  // -1 = 無制限
};
```

#### 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `server/middleware/usageLimit.ts` | 新規 — 使用量チェック＋インクリメント |
| `server/routes/llm.ts` | 各エンドポイントに usageLimit ミドルウェアを追加 |
| `server/app.ts` | 使用量ミドルウェアの登録 |
| `server/database/migrations/005_add_usage_and_subscriptions.sql` | 新規テーブル2つ |

### Phase 3: 決済連携（1〜2週間）

#### 決済サービス比較

Stripe が使えない可能性があるため、代替を含めて比較。

| サービス | 手数料 | 多通貨 | サブスク | MoR (税務代行) | 個人開発者向け |
|---------|-------|--------|---------|---------------|-------------|
| **Stripe** | 2.9%+30¢ (US) / 3.6%+40円 (JP) | 対応 | 対応 | 税計算のみ (Stripe Tax) | ★★★★★ |
| **Paddle** | **5% + $0.50** | 対応 | 対応 | **完全対応** | ★★★★ |
| **Lemon Squeezy** | 5% + $0.50 | 一部 | 対応 | 完全対応 | ★★★ |
| PAY.JP | 3.0-3.6% | JPYのみ | 対応 | なし | ★★★ |
| PayPal | 4.1%+40円+為替3-4% | 対応 | 対応 | なし | ★★ |

#### 推奨: Paddle（Stripe が使えない場合の第1候補）

| 項目 | 詳細 |
|------|------|
| **最大のメリット** | **Merchant of Record（MoR）** — 各国のVAT/GST/売上税の計算・徴収・申告・納付をすべてPaddleが代行。開発者は税務登録不要 |
| **日本からの利用** | 可能。日本の個人事業主・法人ともに利用可 |
| **多通貨** | USD, JPY, EUR, GBP 等に対応。購入者のロケールで自動切り替え |
| **サブスクリプション** | Paddle Billing でプラン管理、アップグレード/ダウングレード、日割り計算 |
| **手数料** | 5% + $0.50/件。Stripeより高いが、税務代行コストを含むと実質同等 |
| **Checkout UI** | オーバーレイ形式（ページ遷移なし） |
| **注意点** | SaaS/デジタル商品に限定（物販不可）。チェックアウトUIのカスタマイズ性がStripeより低い |

> MoR のメリット: グローバルSaaSでは EU VAT、US Sales Tax、その他各国の税制に対応する必要がある。Paddle は「販売者」としてこれらを全て処理するため、個人開発者が各国で税務登録する必要がない。手数料5%は、税理士費用やVAT登録コストを考えると実質的に安い。

#### 決済プランのフォールバック戦略

```
第1候補: Stripe（利用可能な場合）
  └─ 最も機能が豊富、手数料が安い、ドキュメント充実
  └─ 税務処理は Stripe Tax で一部対応 + 自前で申告

第2候補: Paddle（Stripeが使えない場合）
  └─ MoR で税務処理を完全代行
  └─ 手数料は高いが税務コスト込みと考えれば妥当
  └─ SaaS向けに特化しており機能は十分

第3候補: PAY.JP + PayPal（日本特化 + 海外補完）
  └─ PAY.JP で日本ユーザーのJPY決済
  └─ PayPal で海外ユーザーのUSD決済
  └─ 2つのシステムを統合する実装コストが増加
```

#### エンドポイント設計（決済サービス非依存）

| エンドポイント | メソッド | 用途 |
|-------------|--------|------|
| `/api/v1/billing/checkout` | POST | Checkout セッション作成 |
| `/api/v1/billing/portal` | POST | 顧客ポータルURL（プラン変更・解約） |
| `/api/v1/billing/status` | GET | 現在のプラン・使用状況 |
| `/api/v1/webhooks/payment` | POST | 決済 Webhook（署名検証付き） |

> 実装のポイント: `server/services/paymentService.ts` に決済ロジックを抽象化し、Stripe / Paddle / PAY.JP を差し替え可能にする。Webhook のペイロード変換層を設けることで、決済サービス変更時の影響を最小化。

#### 環境変数（Paddle の場合）

```
PADDLE_API_KEY=pdl_...
PADDLE_WEBHOOK_SECRET=pdl_ntf_...
PADDLE_PRO_PRICE_ID=pri_...
PADDLE_PRO_AFF_PRICE_ID=pri_...
PADDLE_ENVIRONMENT=sandbox  # or production
```

### Phase 4: クライアントサイド UI（1週間）

#### 使用量表示

AI入力エリア（ChatPopup、GearInputModal、GearAdvisorChat）の近くに残り回数を表示。

```
例: 「URL extraction: 3/5 remaining this month」
```

制限到達時は入力を無効化し、アップグレード導線を表示。

#### 新規コンポーネント

| コンポーネント | 用途 |
|-------------|------|
| `UpgradeModal.tsx` | Free/Pro 比較表 + Checkout 誘導 |
| `UsageIndicator.tsx` | AI残り回数バッジ |
| `BillingPage.tsx` | プラン管理（変更・解約・請求履歴） |

#### 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `client/components/ChatPopup.tsx` | 使用量インジケーター追加 |
| `client/components/GearInputModal.tsx` | URL抽出の残り回数表示 |
| `client/components/GearAdvisorChat.tsx` | アドバイザー残り回数表示 |
| `client/components/ProfileHeader.tsx` | プラン表示＋アップグレードリンク |
| `client/services/billingService.ts` | 新規 — 決済API通信 |
| `client/utils/types.ts` | BillingStatus, Plan 等の型定義追加 |

---

## 5. 実装ロードマップ

```
Week 1-2  ┃ Phase 0: グローバル対応（並行開発可）
          ┃  ├─ g/oz 重量単位切り替え（weightUnit.ts）
          ┃  ├─ 全UI コンポーネントの単位対応
          ┃  ├─ ユーザー設定に単位プリファレンス追加
          ┃  └─ i18n 基盤セットアップ + 英語ラベル
          ┃
Week 1-2  ┃ Phase 1: 認証基盤（Phase 0と並行）
          ┃  ├─ AWS Cognito User Pool 作成
          ┃  ├─ Amplify Auth でクライアント認証
          ┃  ├─ cognitoAuth ミドルウェア（aws-jwt-verify）
          ┃  ├─ userContext.ts 修正
          ┃  └─ 既存データ移行スクリプト
          ┃
Week 3    ┃ Phase 2: 使用量トラッキング
          ┃  ├─ DB マイグレーション（user_usage, subscriptions）
          ┃  ├─ usageLimit ミドルウェア
          ┃  ├─ LLM ルートへの適用
          ┃  └─ 使用量 API エンドポイント
          ┃
Week 3-4  ┃ Phase 3: 決済連携（Stripe or Paddle）
          ┃  ├─ 決済サービス選定・アカウント作成
          ┃  ├─ paymentService.ts（決済抽象化レイヤー）
          ┃  ├─ Checkout / Portal エンドポイント
          ┃  └─ Webhook ハンドラー
          ┃
Week 4-5  ┃ Phase 4: UI/UX
          ┃  ├─ UsageIndicator / UpgradeModal
          ┃  ├─ BillingPage
          ┃  ├─ BillingPage
          ┃  └─ E2E テスト
```

**合計: 5〜6週間（ソロ開発）**

---

## 6. リスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| 無料枠が十分すぎて課金されない | 収益不足 | 利用データで無料枠を調整。初期はやや少なめに設定 |
| 認証導入で既存データが消える | ユーザー離脱 | マイグレーションスクリプトで確実にデータ引き継ぎ |
| OpenAI の値上げ | コスト増 | gpt-4o-mini への切り替え（コスト1/10）、またはプラン価格見直し |
| oz/g 変換の丸め誤差 | ユーザー混乱 | DBはグラム保存維持、表示層のみ変換。小数点2桁 |
| Cognito の無料枠超過 | コスト増 | 50,000 MAU 超過は $0.0055/MAU。10万 MAU でも $275/月 — 収益で十分カバー |
| 地域別税制（VAT等） | 法的リスク | Stripe Tax の自動税計算。閾値以下は免除対応 |
