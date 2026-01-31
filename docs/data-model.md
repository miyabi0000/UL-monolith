# UL Gear Manager データモデル概念（最終版）

## 0. 表現形式の二面性

| 表現   | コンポーネント              | 役割                  |
| ---- | -------------------- | ------------------- |
| 認識論的 | GearChart / Analysis | 視覚的理解、意思決定支援        |
| データ的 | Table / List         | 正確な数値、CRUD、フィルタ/ソート |

---

## 1. 意味論軸（Semantics Axes）

### A. 分類（Category：整理軸）

| フィールド         | 所属       | 型        | 説明                                                |
| ------------- | -------- | -------- | ------------------------------------------------- |
| `category_id` | GearItem | FK       | カテゴリ参照                                            |
| `tags[]`      | Category | string[] | 拡張タグ（例：`big3_pack`, `big3_sleep`, `big3_shelter`） |

例（Category）:

* Backpack（`big3_pack`）
* Shelter（`big3_shelter`）
* Sleep System（`big3_sleep`）
* Clothing / Cooking / Electronics（タグなし）

---

### B. 調達（Procurement：行動軸）

数量を正とし、ステータスは派生とする。

| フィールド                | 型      | 説明                       |
| -------------------- | ------ | ------------------------ |
| `required_qty`       | number | 必要数                      |
| `owned_qty`          | number | 所持数                      |
| `procurement_status` | 派生     | `owned / partial / need` |

派生:

* `owned`：`owned_qty >= required_qty`
* `need`：`owned_qty = 0 && required_qty > 0`
* `partial`：それ以外（`0 < owned_qty < required_qty`）

---

### C. 会計（Accounting：計算軸）

| フィールド          | 型    | 値                          |
| -------------- | ---- | -------------------------- |
| `weight_class` | enum | `base / worn / consumable` |

定義:

* `base`：背負って運ぶ装備
* `worn`：身に着けて運ぶ
* `consumable`：消費物（減る）

---

### D. 優先度（Priority）

| フィールド               | 型   | 対象           | 説明                |
| ------------------- | --- | ------------ | ----------------- |
| `purchase_priority` | 0–3 | need/partial | 購入優先度             |
| `upgrade_priority`  | 0–3 | owned        | 買い替え/軽量化優先度（MVP後） |

---

## 2. 属性（Facts）

| UI列    | フィールド               | 型           | 定義                          |
| ------ | ------------------- | ----------- | --------------------------- |
| Image  | `image_url`         | string|null | 参照URL                       |
| Name   | `name_display`      | string      | 表示名（任意で `brand/model` 分離）   |
| Wt(g)  | `weight_g`          | number|null | gに統一                        |
|        | `weight_confidence` | enum        | `high/med/low`              |
|        | `weight_source`     | enum        | `manual/jsonld/og/html/llm` |
| Price  | `price_minor`       | number|null | 最小通貨単位の整数                   |
|        | `currency`          | string      | ISO 4217（例：JPY, USD）        |
| Season | `season_tags[]`     | string[]    | `spring/summer/fall/winter` |
| Kit    | `is_in_kit`         | boolean     | 集計対象フラグ                     |

Nullの意味:

* `weight_g=null`：重量未確定（集計除外）
* `price_minor=null`：価格未確定（Need cost集計除外）

---

## 3. 派生（Derived：集計で算出）

派生値はDBに保存せず、クエリ/キャッシュで算出する。
すべての集計は `is_in_kit=true` を前提とする。

| 指標              | 計算式                                                                         |
| --------------- | --------------------------------------------------------------------------- |
| Base Weight     | `Σ(weight_g WHERE weight_class='base')`                                     |
| Worn Weight     | `Σ(weight_g WHERE weight_class='worn')`                                     |
| Consumables     | `Σ(weight_g WHERE weight_class='consumable')`                               |
| Packed Weight   | `Base + Consumables`                                                        |
| Skin-out Weight | `Base + Worn + Consumables`                                                 |
| Need Cost       | `Σ(price_minor WHERE status IN ('need','partial'))`                         |
| Big3            | `Σ(weight_g WHERE weight_class='base' AND category.tags CONTAINS 'big3_*')` |

---

## 4. UL基準（参照）

| 分類          | Base Weight       |
| ----------- | ----------------- |
| Ultralight  | < 4.5kg (10lb)    |
| Lightweight | 4.5–9kg (10–20lb) |
| Traditional | > 9kg (20lb)      |

---

## 5. UI列セット（最小）

```
Image | Name | Cat | ReqQty | OwnQty | Status(derived) | WtClass | Wt(g) | Price | Pri | Season
```

役割:

* Cat：整理
* Req/Own/Status：調達（数量＋派生）
* Pri：購入計画（need/partial）／買い替え（owned, MVP後）
* WtClass：会計（チャート/分析の基盤）
* Wt/Price/Season：属性

---

## 6. TypeScript定義（実装用）

```ts
type WeightClass = 'base' | 'worn' | 'consumable';
type WeightConfidence = 'high' | 'med' | 'low';
type WeightSource = 'manual' | 'jsonld' | 'og' | 'html' | 'llm';
type Priority = 0 | 1 | 2 | 3;
type ProcurementStatus = 'owned' | 'partial' | 'need';

interface Category {
  id: string;
  user_id: string | null;
  name: string;
  tags: string[];
}

interface GearItem {
  id: string;
  user_id: string;

  category_id: string | null;

  required_qty: number;
  owned_qty: number; // statusは派生

  weight_class: WeightClass;

  purchase_priority: Priority;
  upgrade_priority: Priority; // MVP後

  image_url: string | null;
  name_display: string;

  weight_g: number | null;
  weight_confidence: WeightConfidence;
  weight_source: WeightSource;

  price_minor: number | null;
  currency: string; // ISO 4217

  season_tags: string[];
  is_in_kit: boolean;

  created_at: string;
  updated_at: string;
}

function deriveStatus(required: number, owned: number): ProcurementStatus {
  if (owned >= required) return 'owned';
  if (owned === 0 && required > 0) return 'need';
  return 'partial';
}
```

---

## 7. 実装ロードマップ（最短）

1. `weight_class` 追加（default: `base`）
2. `weight_confidence`, `weight_source` 追加
3. `price_minor + currency` 追加
4. `is_in_kit` 追加（default: true）
5. Categoryに `tags[]` 追加（Big3タグ）
6. 集計API（weight breakdown / need cost / big3）
7. UI：テーブル列（WtClass/Status）＋サマリーカード（Base/Worn/Cons/Packed/Big3）

---

作成日: 2026-01-31
更新日: 2026-01-31
