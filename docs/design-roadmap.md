# UL Gear Manager 設計ロードマップ

> 作成日: 2026-04-08
> 目標: 世に出せる状態に最短で持っていく

**サービス概要**: ハイカー・バックパッカー・登山者向け。自分のギアをAIで最適化し、パックリストを作成して共有する。

---

## 現状の課題（出荷を阻むもの）

| 課題 | 深刻度 | 現状 |
|------|--------|------|
| 認証がモック | **致命的** | ハードコードされた demo@example.com。APIは誰でもアクセス可能 |
| パックが localStorage のみ | **致命的** | 公開パックは実質動かない。キャッシュ消去でデータ消失 |
| プロフィールが localStorage のみ | 高 | デバイス間同期不可 |
| カードビューが空 | 中 | 画像 or 名前のみ。重量・価格・優先度が見えない |
| AIアドバイザーが会話を保持しない | 中 | リロードで消える。セッション管理なし |
| 重量単位が g のみ | 中 | グローバル展開の前提（oz 対応必須） |
| 多言語未対応 | 低〜中 | 日本語固定。英語 UI が最低限必要 |
| CSV入出力なし | **スコープ外** | 優先度低。後回し |

---

## 優先度順タスク一覧

### P0: 出荷ブロッカー（これがないと公開できない）

#### 1. 認証基盤 — AWS Cognito

詳細は [monetization-proposal.md Phase 1](monetization-proposal.md) を参照。

| 項目 | 内容 |
|------|------|
| 目的 | ユーザー登録・ログイン・JWT認証 |
| 技術 | AWS Cognito + Amplify (クライアント) + aws-jwt-verify (サーバー) |
| 既存資産 | `AuthContext.tsx` に Cognito パスワードバリデーション済み |
| 変更対象 | `AuthContext.tsx`, `server/middleware/cognitoAuth.ts`(新規), `userContext.ts`, `auth.ts`, `app.ts` |
| 工数 | 1〜2週間 |

#### 2. パックの DB 移行

**現状**: `usePacks.ts` で localStorage に保存。公開パック機能が実質無効。

```sql
CREATE TABLE packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  route_name VARCHAR(200),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pack_items (
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  gear_id UUID NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
  PRIMARY KEY (pack_id, gear_id)
);

CREATE INDEX idx_packs_user ON packs(user_id);
CREATE INDEX idx_packs_public ON packs(is_public) WHERE is_public = true;
```

**API エンドポイント**:

| エンドポイント | メソッド | 用途 |
|-------------|--------|------|
| `/api/v1/packs` | GET | ユーザーのパック一覧 |
| `/api/v1/packs` | POST | パック作成 |
| `/api/v1/packs/:id` | PUT | パック更新（名前・公開設定） |
| `/api/v1/packs/:id` | DELETE | パック削除 |
| `/api/v1/packs/:id/items` | PUT | パック内アイテム更新（全置換） |
| `/api/v1/packs/public/:id` | GET | 公開パック取得（認証不要） |

**変更対象**: `usePacks.ts` → API通信に置換、`server/routes/packs.ts`(新規)、`PackDetailPage.tsx`

**マイグレーション**: 初回ログイン時に localStorage のパックデータをAPI経由でDBに保存。完了後に localStorage のパックデータを削除。

**工数**: 1週間

#### 3. プロフィールの DB 移行

```sql
ALTER TABLE users ADD COLUMN display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN handle VARCHAR(50);
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN header_image_url TEXT;
ALTER TABLE users ADD COLUMN weight_unit VARCHAR(2) DEFAULT 'g';  -- 'g' | 'oz'
ALTER TABLE users ADD COLUMN locale VARCHAR(10) DEFAULT 'ja';
```

**工数**: 2〜3日（パック移行と並行可）

---

### P1: コア体験の強化（出荷品質を上げる）

#### 4. カードビューの改善

**現状の問題**: `CardGridView.tsx` は画像 or 名前のみ表示。ギアリストの情報がほぼ見えない。

**方針**: 画像は不要。ギアリストにある情報をコンパクトにテキスト表示する。タップで下にスライドして詳細確認。

```
通常状態（コンパクトテキスト表示）:
┌──────────────────────┐
│ Nemo Tensor         P2│  ← 名前 + 優先度
│ 420g   ¥12,000        │  ← 重量 + 価格
│ base   Shelter     1/1│  ← WeightClass + カテゴリ + 所持数
└──────────────────────┘

  ↓ タップ（下にスライド展開）

┌──────────────────────┐
│ Nemo Tensor         P2│
│ 420g   ¥12,000        │
│ base   Shelter     1/1│
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Brand: NEMO           │
│ Seasons: spring,fall  │
│ Source: jsonld (high)  │
│ [Edit]     [Link →]   │
└──────────────────────┘
```

**実装方針**:
- 画像表示を廃止し、テキスト情報のみで構成
- 1行目: 名前（左寄せ）+ 優先度バッジ（右寄せ）
- 2行目: 重量 + 価格
- 3行目: WeightClass + カテゴリ名 + 所持数/必要数
- タップで展開: ブランド、シーズン、重量ソース/信頼度、Edit/Linkボタン
- 展開アニメーション: CSS `max-height` + `transition`

**変更対象ファイル**:

| ファイル | 変更内容 |
|---------|---------|
| `client/components/DetailPanel/CardGridView.tsx` | テキストカードに全面書き換え + タップ展開 |

**工数**: 1〜2日

#### 5. AIアドバイザー機能強化

**現状**: 基本的なチャット + 提案編集適用は動く。会話はリロードで消える。

**強化内容（優先度順）**:

##### 5-1. 会話の永続化（必須）

```sql
CREATE TABLE advisor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  pack_id UUID REFERENCES packs(id),  -- パックスコープの場合
  title VARCHAR(200),  -- 自動生成 or ユーザー設定
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE advisor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES advisor_sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL,  -- 'user' | 'assistant'
  content TEXT NOT NULL,
  suggested_edits JSONB,  -- 提案編集のJSON
  gear_refs JSONB,        -- ギア参照のJSON
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**変更対象**: `useAdvisorChat.ts`, `server/routes/llm.ts`, 新規 `server/routes/advisor.ts`

**工数**: 3〜4日

##### 5-2. クイックプロンプト（定型質問）

現在はフリーテキスト入力のみ。初見ユーザーが何を聞けばいいかわからない。

```
チャット入力欄の上に表示:
┌──────────────────────────────────────┐
│ [⚡ Reduce base weight]              │
│ [📊 Analyze my Big 3]               │
│ [💰 Find cheaper alternatives]       │
│ [🎒 Optimize for 3-day trip]         │
└──────────────────────────────────────┘
```

```typescript
const QUICK_PROMPTS = [
  { icon: '⚡', label: 'Reduce base weight', prompt: 'How can I reduce my base weight? Focus on the heaviest items.' },
  { icon: '📊', label: 'Analyze Big 3', prompt: 'Analyze my Big 3 (pack, shelter, sleep). Are they optimal?' },
  { icon: '💰', label: 'Cheaper alternatives', prompt: 'Suggest cheaper alternatives for my most expensive items.' },
  { icon: '🎒', label: 'Trip optimization', prompt: 'Optimize my gear list for a 3-day backpacking trip.' },
] as const;
```

**工数**: 1日

##### 5-3. 提案の一括適用 + Undo

現状は1つずつ「Apply change」ボタンを押す。複数提案の一括適用と、適用後のUndo機能。

```
┌─ AI提案カード ─────────────────────┐
│  Tent: 2000g → 1200g (reason...)  │  ☐
│  Stove: 350g → 85g (reason...)    │  ☐
│  Pad: 680g → 430g (reason...)     │  ☐
│                                    │
│  [☐ Select All]  [Apply Selected]  │
└────────────────────────────────────┘
```

Undo は `gear_history` テーブル（既存）を活用。適用前の値を保存し、戻せるようにする。

**工数**: 2〜3日

##### 5-4. アドバイザーのスコープ拡張

現在: ギアの重量最適化のみ。

追加スコープ:
- **パック構成の提案**: 「3日間のアルプス縦走」と入力 → 必要なギアカテゴリと推奨アイテムを提案
- **季節別最適化**: 「夏のテント泊装備を軽量化して」→ 季節フィルターを考慮した提案
- **コミュニティ比較**: 「自分のベースウェイトはULの基準に達しているか」→ UL判定 + 具体的な改善点

**実装**: サーバーサイドのプロンプトテンプレート拡張（`server/services/llmService.ts`）

**工数**: 2〜3日

---

### P2: グローバル対応

#### 6. 重量単位 g/oz 切り替え

`client/utils/weightUnit.ts` は作成済み。UI への適用が必要。

**変更対象ファイル**:

| ファイル | 変更内容 |
|---------|---------|
| `client/utils/formatters.ts` | `formatWeight` を `weightUnit.ts` に委譲 |
| `client/components/GearTable/EditableFields.tsx` | 入力フィールドに単位切り替え |
| `client/components/gear-input/GearInputModal.tsx` | Weight (grams) → Weight (g/oz) |
| `client/components/GearForm.tsx` | 同上 |
| `client/components/WeightBreakdownCard.tsx` | 表示単位切り替え |
| `client/components/ComparisonTable.tsx` | 比較表の単位対応 |
| `client/components/DetailPanel/CardGridView.tsx` | カード上の重量表示 |
| `client/components/DetailPanel/ItemListCard.tsx` | リストカードの重量表示 |
| `client/components/ProfileHeader.tsx` | 単位設定トグル |

**ユーザー設定**: `users.weight_unit` カラム（P0-3のDB移行で追加済み）から取得。未ログイン時は localStorage。

**工数**: 3〜4日

#### 7. 多言語対応（最低限 英語）

`react-i18next` 導入。Phase 1 は UI ラベルのみ。

**工数**: 1週間（翻訳込み）

---

### スコープ外（やらない / 後回し）

| 項目 | 理由 |
|------|------|
| CSV 入出力 | 優先度低。ユーティリティ関数 (`weightUnit.ts`) は準備済みだが UI は後回し |
| アフィリエイトリンク | マネタイズの一要素だが、ローンチ後に検討。詳細は `monetization-proposal.md` 参照 |
| コミュニティ機能（パックフォーク等） | ユーザー基盤ができてから |
| モバイルアプリ（ネイティブ） | PWA で十分。ネイティブは後回し |
| 管理画面 | ローンチ後に必要に応じて |
| 決済（マネタイズ） | 別ドキュメント参照。認証・DB移行の後に実装 |

---

## 実装ロードマップ

```
Week 1    ┃ P0-1: 認証基盤
          ┃  ├─ Cognito User Pool 作成
          ┃  ├─ AuthContext.tsx → Amplify Auth
          ┃  ├─ cognitoAuth ミドルウェア
          ┃  └─ userContext.ts 修正
          ┃
Week 2    ┃ P0-2,3: DB移行（パック + プロフィール）
          ┃  ├─ packs / pack_items テーブル + API
          ┃  ├─ users テーブル拡張（profile + weight_unit）
          ┃  ├─ usePacks.ts → API通信に置換
          ┃  ├─ useProfile.ts → API通信に置換
          ┃  └─ localStorage → DB マイグレーション処理
          ┃
Week 3    ┃ P1-4: カードビュー改善
          ┃  ├─ テキストカード（重量・価格・優先度・カテゴリ・所持数）
          ┃  └─ タップ展開（ブランド・シーズン・Edit/Link）
          ┃
Week 3-4  ┃ P1-5: AIアドバイザー強化
          ┃  ├─ 会話永続化（advisor_sessions / advisor_messages）
          ┃  ├─ クイックプロンプト
          ┃  ├─ 提案の一括適用 + Undo
          ┃  └─ スコープ拡張（パック構成提案・季節最適化）
          ┃
Week 4    ┃ P2-6: g/oz 切り替え
          ┃  ├─ weightUnit.ts → 全UIコンポーネントに適用
          ┃  └─ ユーザー設定 (DB / localStorage)
          ┃
Week 5    ┃ P2-7: 多言語 + 仕上げ
          ┃  ├─ react-i18next 導入 + 英語ラベル
          ┃  ├─ 公開パックページの動作確認
          ┃  ├─ モバイル実機テスト
          ┃  └─ エラーハンドリング・エッジケース修正
```

**合計: 5週間（ソロ開発）**

---

## 技術的な注意事項

### localStorage → DB マイグレーション戦略

```
初回ログインフロー:
  1. ユーザーが Cognito でサインアップ/ログイン
  2. クライアントが localStorage にパック/プロフィールデータがあるか確認
  3. ある場合 → API経由でDBに一括保存
  4. 成功 → localStorage のデータを削除
  5. 以降は DB からのみ読み書き
```

### 公開パックの認証

```
認証あり: /api/v1/packs/*         → cognitoAuth ミドルウェア必須
認証なし: /api/v1/packs/public/:id → 認証不要、is_public=true のパックのみ返却
```

### カード展開のパフォーマンス

大量のカード（100+アイテム）で展開アニメーションがカクつく可能性。対策:
- 展開中のカードのみ詳細データをレンダリング（遅延レンダリング）
- `will-change: max-height` で GPU アクセラレーション
- 画面外のカードは仮想化（`react-window` 等）を将来検討
