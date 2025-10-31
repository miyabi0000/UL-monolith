-- Migration: Change season from single value to seasons array
-- Date: 2025-10-29

-- Step 1: Add new seasons column as TEXT array
ALTER TABLE gear_items
ADD COLUMN IF NOT EXISTS seasons TEXT[];

-- Step 2: Migrate existing season data to seasons array
-- Convert 'autumn' to 'fall' for consistency
UPDATE gear_items
SET seasons = ARRAY[
  CASE
    WHEN season = 'autumn' THEN 'fall'
    ELSE season
  END
]::TEXT[]
WHERE season IS NOT NULL;

-- Step 3: Drop old season column
ALTER TABLE gear_items
DROP COLUMN IF EXISTS season;

-- Step 4: Add constraint to ensure valid season values
ALTER TABLE gear_items
ADD CONSTRAINT check_seasons_valid
CHECK (
  seasons IS NULL OR
  seasons <@ ARRAY['spring', 'summer', 'fall', 'winter']::TEXT[]
);

-- Step 5: Update index for seasons
DROP INDEX IF EXISTS idx_gear_items_season;
CREATE INDEX IF NOT EXISTS idx_gear_items_seasons ON gear_items USING gin(seasons);
