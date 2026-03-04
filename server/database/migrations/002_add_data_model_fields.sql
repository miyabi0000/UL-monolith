-- Migration: 002_add_data_model_fields
-- データモデル概念仕様書に基づくフィールド追加
-- Date: 2026-01-31

-- ===== 1. 会計軸（weight_class）追加 =====
-- 'base': 背負って運ぶ装備
-- 'worn': 身に着けて運ぶ
-- 'consumable': 消費物（減る）

DO $$ BEGIN
    CREATE TYPE weight_class_enum AS ENUM ('base', 'worn', 'consumable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE gear_items
ADD COLUMN IF NOT EXISTS weight_class weight_class_enum DEFAULT 'base' NOT NULL;

-- ===== 2. 重量信頼度（weight_confidence）追加 =====

DO $$ BEGIN
    CREATE TYPE weight_confidence_enum AS ENUM ('high', 'med', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE gear_items
ADD COLUMN IF NOT EXISTS weight_confidence weight_confidence_enum DEFAULT 'low' NOT NULL;

-- ===== 3. 重量ソース（weight_source）追加 =====

DO $$ BEGIN
    CREATE TYPE weight_source_enum AS ENUM ('manual', 'jsonld', 'og', 'html', 'llm');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE gear_items
ADD COLUMN IF NOT EXISTS weight_source weight_source_enum DEFAULT 'manual' NOT NULL;

-- ===== 4. キット包含フラグ（is_in_kit）追加 =====

ALTER TABLE gear_items
ADD COLUMN IF NOT EXISTS is_in_kit BOOLEAN DEFAULT true NOT NULL;

-- ===== 5. カテゴリタグ（tags）追加 =====

ALTER TABLE categories
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}' NOT NULL;

-- ===== 6. Big3カテゴリにタグを設定 =====

-- Pack (Backpack) -> big3_pack
UPDATE categories SET tags = ARRAY['big3_pack']
WHERE name IN ('Pack', 'Backpack') AND tags = '{}';

-- Shelter -> big3_shelter
UPDATE categories SET tags = ARRAY['big3_shelter']
WHERE name = 'Shelter' AND tags = '{}';

-- Sleep -> big3_sleep
UPDATE categories SET tags = ARRAY['big3_sleep']
WHERE name IN ('Sleep', 'Sleep System') AND tags = '{}';

-- ===== 7. インデックス追加 =====

CREATE INDEX IF NOT EXISTS idx_gear_items_weight_class ON gear_items(weight_class);
CREATE INDEX IF NOT EXISTS idx_gear_items_is_in_kit ON gear_items(is_in_kit) WHERE is_in_kit = true;
CREATE INDEX IF NOT EXISTS idx_categories_tags ON categories USING gin(tags);

-- ===== 8. 集計用複合インデックス =====

CREATE INDEX IF NOT EXISTS idx_gear_items_weight_breakdown
ON gear_items(user_id, weight_class, is_in_kit)
WHERE is_in_kit = true;

COMMENT ON COLUMN gear_items.weight_class IS '会計軸: base(背負う)/worn(着る)/consumable(消耗)';
COMMENT ON COLUMN gear_items.weight_confidence IS '重量信頼度: high/med/low';
COMMENT ON COLUMN gear_items.weight_source IS '重量ソース: manual/jsonld/og/html/llm';
COMMENT ON COLUMN gear_items.is_in_kit IS 'キット包含フラグ（集計対象）';
COMMENT ON COLUMN categories.tags IS 'カテゴリタグ（例: big3_pack, big3_shelter, big3_sleep）';
