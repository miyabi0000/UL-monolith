# デッドコード監査レポート

最終更新: 2026-04-24
対象コミット: `claude/identify-dead-code-78V17` 作成時点
調査方法: 3 つの Explore サブエージェント（client / server / リポジトリ全体）を並列実行し、`grep -rn` による裏付けを取得。主要 findings はメインエージェントでスポットチェック済み。

## 概要

UL Gear Manager は複数回の機能追加・リファクタリングを経ており、旧機能のコードが残存している。本レポートは参照されていないコードを優先度付きで一覧化したもの。

| 優先度 | 対象 | 推定削減行数 |
|---|---|---:|
| P0 | 未使用ファイル削除 + 未使用 export 削除 | 約 1,900 行 |
| P1 | 連鎖削除 | 約 30 行 |
| P2 | ドキュメント / 設定整理 | 未計測 |
| P3 | 型・ロジック共通化リファクタ | （削減ではなく構造改善） |

---

## P0: 即削除可能（参照なし・副作用なし）

どこからも import されておらず、削除による連鎖的影響がない／影響が閉じている。コード行数削減インパクトが大きく、最も優先して手を付けるべき対象。

### P0-1: 未使用コンポーネント 8 ファイル（計 1,114 行）

| ファイル | 行数 | 備考 |
|---|---:|---|
| `client/components/BulkActionModal.tsx` | 286 | 一括操作モーダル。import ゼロ |
| `client/components/CategoryManager.tsx` | 266 | `client/hooks/useAppState.ts:11` に「カテゴリ管理UIはフロントから廃止 (3b5e200)」とコメントあり。import ゼロ |
| `client/components/HistoryModal.tsx` | 214 | 変更履歴モーダル。import ゼロ |
| `client/components/WeightBreakdownCard.tsx` | 159 | 重量内訳カード。import ゼロ |
| `client/components/CompactSummary.tsx` | 96 | パック概要カード。import ゼロ |
| `client/components/ComparisonPage.tsx` | 51 | ルーティング未登録の開発途中ページ |
| `client/components/ViewSwitcher.tsx` | 34 | ビュー切替 UI。import ゼロ |
| `client/components/HomePage.tsx` | 8 | `InventoryWorkspace` のラッパー。`App.tsx` で使われていない |

検証: `grep -rn "ComponentName" client/ --include="*.tsx" --include="*.ts"` で外部 import 一切なし。`client/components/InventoryWorkspace.tsx:17` の廃止履歴コメントのみヒット。

### P0-2: 未使用の DetailPanel サブビュー 3 ファイル（計 599 行）

| ファイル | 行数 |
|---|---:|
| `client/components/DetailPanel/CompareView.tsx` | 290 |
| `client/components/DetailPanel/TableView.tsx` | 177 |
| `client/components/DetailPanel/OverviewView.tsx` | 132 |

検証: 同ディレクトリ内の `GearDetailPanel` からも外部からも import されていない。同ディレクトリの `CardGridView.tsx` / `GearInfoSummary.tsx` / `ItemListCard.tsx` は使用中なので区別が必要。

### P0-3: 未使用フック / ユーティリティ（計 160 行）

| ファイル | 行数 | 備考 |
|---|---:|---|
| `client/utils/messages.ts` | 89 | 全定数（`BULK_URL_MESSAGES` / `GEAR_MESSAGES` / `AUTH_MESSAGES`）が未使用。参照ゼロ |
| `client/hooks/useWeightInput.ts` | 54 | 呼び出し元なし。`EditableWeightField` は独自実装 |
| `client/utils/urlHelpers.ts` | 17 | `extractMultipleUrls()`。`client/components/ChatSidebar.tsx:66` に**同名のローカル関数が重複定義**されており、そちらが使われている |

### P0-4: 未使用のサーバー側 export

| 場所 | シンボル | 備考 |
|---|---|---|
| `server/services/llmService.ts:106` | `analyzeList()` | サーバー側ハンドラ未実装（`server/routes/llm.ts` に mount なし）。対応 URL が `client/services/api.client.ts:40` に残るが呼び出し元なし |
| `server/utils/helpers.ts:56` | `calculateGearFields()` | 呼び出し元なし |
| `server/utils/validation.ts:83` | `sanitizeGearForm()` | 呼び出し元なし。`server/utils/helpers.ts:sanitizeGearData()` が同等機能を提供し現役 |
| `client/services/api.client.ts:40` | `analyzeList: '/llm/analyze-list'` | 上記サーバーメソッド削除と同時に削除。URL 定義のみ残存 |

### P0-5: `designSystem.ts` の deprecated 互換シム 5 個

`client/utils/designSystem.ts` 内のみで定義、外部参照ゼロ。明示的に `@deprecated` マークあり。

| 行 | シンボル | 代替 |
|---:|---|---|
| 252-255 | `getCategoryBadgeStyle()` | `getCategoryColor()` |
| 261-264 | `generateItemColor()` | `client/utils/colorHelpers.ts` の同名関数（現役） |
| 305 | `getCategoryBadgeShade()` | `getCategoryColor()` |
| 308 | `CHART_GRAYSCALE` | `CATEGORY_PALETTE` |
| 310 | `getChartGrayShade()` | `getCategoryColorByIndex()` |

---

## P1: 連鎖削除（P0 削除に伴い不要になる）

P0 アイテムを削除すると自然に不要になるもの。**P0 と同じ PR でまとめて削除** が推奨。

| 場所 | 内容 | トリガー |
|---|---|---|
| `client/services/gearService.ts:99-107` | `getGearHistory()` | `HistoryModal` 削除で唯一の呼び出し元が消える |
| `client/services/gearService.ts:110-118` | `revertGear()` | 同上 |
| `client/utils/types.ts` | `ViewMode` 型 | `CompactSummary` / `ViewSwitcher` 削除で参照消失する可能性（要最終確認） |
| `client/components/ChatSidebar.tsx:66-82` | ローカル `extractMultipleUrls` | **重複解消方法は要決定**。`utils/urlHelpers.ts` を残してローカル版を import に置換するか、逆かをユーザーに確認 |

---

## P2: 要ユーザー確認（意図的な可能性あり）

### P2-1: 古いドキュメント / スキーマ

| ファイル | 判定 |
|---|---|
| `docs/simplified-schema.sql` | 現行は `migrations/` で管理。どこからも参照されず。削除候補だが「参考資料として保持」の意図がないか確認 |
| `docs/pr-comment-remove-zen-background.md` | PR 参考資料。削除は慎重に（保持推奨） |
| `docs/pr-comment-packs-ui.md` | 同上 |
| `docs/GEAR_CHART_SPEC.md` / `GEAR_COMPARISON_SPEC.md` / `SEASON_EDIT_SPEC.md` | 実装先行・ドキュメント後追いで乖離。削除ではなく更新 or アーカイブ |

### P2-2: 設定ファイル

- `vite.config.ts:16` の `publicDir: '../public'` — `public/` ディレクトリが存在しない。Vite は警告なしで動作するが設定自体が不要な可能性。削除 or ディレクトリ作成を要確認
- `.eslintrc.cjs:18-22` の `@typescript-eslint/no-unused-vars: 'off'` — **有効化すると今後のデッドコード検出が自動化できる**。ただし既存ファイル内の未使用ローカル変数が多数検出される見込みのため、段階的対応推奨

### P2-3: 未使用 `@types` パッケージ

`package.json` の `@types/axios`, `@types/cheerio` — 本体パッケージが自前の型定義を提供するため不要。ただし devDependencies のため挙動影響は軽微。削除 OK だが優先度低。

---

## P3: 中期リファクタリング（削除ではなく整理）

即座の削除対象ではないが、デッドコード発生源となっているため中期的に着手すべき構造課題。

### P3-1: client/server 間の型定義・ロジック重複

`client/utils/types.ts` と `server/models/types.ts` で以下が重複:

- 型: `WeightClass` / `WeightConfidence` / `WeightSource` / `ProcurementStatus` / `Category` / `GearItem` / `GearItemForm` / `LLMExtractionResult` / `WeightBreakdown` / `CostBreakdown` / `ULClassification` / `UL_THRESHOLDS`
- 定数: `DEFAULT_GEAR_VALUES`
- 関数: `deriveStatus()` / `isBig3Category()` / `enforceWeightClassForBig3()`

`server/models/types.ts:3` に「client と同期を保つこと」コメントがあり意図的同期だが、**`Category` と `GearItem` は日付型や `llmData` スキーマが既に乖離**。`shared/` ディレクトリ新設による共通化が中期課題。

---

## 推奨 PR 分割

1. **PR1: P0-1 ～ P0-3（未使用ファイル削除）** — 最大インパクト、副作用なし
2. **PR2: P0-4 + P0-5（未使用 export 削除）** — client/server 両方に触れるためファイル単位と分離
3. **PR3: P1 の連鎖削除 + `extractMultipleUrls` 重複解消** — P0 削除後に実施
4. **PR4 以降: P2 / P3** — ユーザー確認を経て個別検討

各 PR 後に `npm run lint` / `npm run typecheck` / `npm run build` を実行して壊れないことを確認（CLAUDE.md のチェックリスト準拠）。

---

## 再検証手順

本レポートの findings を第三者が再検証する手順:

```bash
# P0-1 / P0-2 の未使用確認（コンポーネント自身以外から import されないこと）
grep -rn "BulkActionModal\|CategoryManager\|WeightBreakdownCard\|HistoryModal\|CompactSummary\|ComparisonPage\|ViewSwitcher\|HomePage" client/ --include="*.tsx" --include="*.ts" \
  | grep -v "^client/components/"

# P0-3 messages.ts の完全未使用確認
grep -rln "from.*utils/messages" client/ server/

# P0-4 サーバー側未使用関数の確認
grep -rn "calculateGearFields\|sanitizeGearForm" --include="*.ts"
grep -rn "analyzeList" server/

# P0-5 deprecated 関数の外部参照確認（designSystem.ts 以外から参照されていないこと）
grep -rn "getCategoryBadgeStyle\|getCategoryBadgeShade\|CHART_GRAYSCALE\|getChartGrayShade" client/ \
  | grep -v "designSystem.ts"
```

---

## 注意事項

- `analyzeList` は client 側にも URL 定義（`client/services/api.client.ts:40`）が残っている。**将来実装予定**の可能性があるため、削除前にユーザーに意図を確認すること
- `@types/axios` / `@types/cheerio` 削除は `package-lock.json` も更新される。ビルドに影響しないことを確認してからコミット
- ESLint の `no-unused-vars: off` を有効化するとおそらく**既存ファイル内に多数の未使用ローカル変数が検出される**。有効化は別タスクで段階的に
