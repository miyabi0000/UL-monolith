-- Migration: 004_normalize_category_colors_to_japanese_palette
-- 既存カテゴリカラーを日本色パレットに正規化

-- 日本色パレット:
-- #00A3AF #FFB11B #274A78 #7BA23F #E2041B #7058A3
-- #5654A2 #5B6B73 #1B1D1B #F7C6C7 #C37854 #A8D8B9

UPDATE categories
SET color = UPPER(color)
WHERE color IS NOT NULL;

UPDATE categories
SET color = CASE
  WHEN color IN (
    '#00A3AF', '#FFB11B', '#274A78', '#7BA23F', '#E2041B', '#7058A3',
    '#5654A2', '#5B6B73', '#1B1D1B', '#F7C6C7', '#C37854', '#A8D8B9'
  ) THEN color
  WHEN color IN ('#4ECDC4', '#45B7D1') THEN '#00A3AF'
  WHEN color IN ('#FFE66D', '#F39C12') THEN '#FFB11B'
  WHEN color = '#4D96FF' THEN '#274A78'
  WHEN color = '#27AE60' THEN '#7BA23F'
  WHEN color IN ('#FF6B6B', '#E74C3C') THEN '#E2041B'
  WHEN color IN ('#A66DFF', '#8E44AD') THEN '#7058A3'
  WHEN color IN ('#6B7280', '#9CA3AF') THEN '#5B6B73'
  ELSE '#5B6B73'
END
WHERE color IS NOT NULL;
