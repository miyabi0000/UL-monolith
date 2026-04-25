import { COLORS } from './designSystem'

// ==================== 定数 ====================
// デザインシステムに基づいたチャート設定（コンパクト化）
export const CHART_CONFIG = {
  height: {
    mobile: 240,
    tablet: 300,
    desktop: 340
  },
  outerRadius: {
    mobile: { outer: 96, inner: 68 },
    tablet: { outer: 128, inner: 92 },
    desktop: { outer: 160, inner: 112 }
  },
  innerRadius: {
    mobile: { outer: 68, inner: 44 },
    tablet: { outer: 92, inner: 60 },
    desktop: { outer: 112, inner: 76 }
  },
  centerMaxWidth: {
    mobile: 96,   // 80 → 96 (中央テキストの折返しを抑える)
    tablet: 112,
    desktop: 144
  }
} as const

// UL分類カラートークン
export const UL_BADGE_COLORS = {
  ultralight: COLORS.success,
  lightweight: COLORS.warning,
  traditional: COLORS.error
} as const

// フォントサイズトークン
export const FONT_SIZES = {
  center: {
    primary:   { mobile: '0.95rem', desktop: '1.4rem' },   // 値表示 — モバイルは 1.1 → 0.95rem
    secondary: { mobile: '0.55rem', desktop: '0.75rem' },  // ラベル — モバイルは 0.65 → 0.55rem
    tertiary:  { mobile: '0.5rem',  desktop: '0.65rem' }   // サブ情報 — モバイルは 0.55 → 0.5rem
  },
  badge: { mobile: '0.5rem', desktop: '0.55rem' },
  // Bar / 軸ラベル — recharts は数値 px を期待するため number で定義
  axis: {
    tick:  { mobile: 11, desktop: 11 },   // X 軸 (数値) — 9px ハードコードから引上げ
    label: { mobile: 12, desktop: 11 },   // Y 軸 (カテゴリ) — モバイルで 1 段大きく
  }
} as const

/** Bar Chart の Y 軸カテゴリラベルが省略前に保持できる最大文字数 */
export const BAR_LABEL_MAX_CHARS = {
  mobile: 8,    // Cooking までは入る
  tablet: 11,
  desktop: 14,
} as const

// ヘルパー関数は chartHelpers.ts に集約:
//   formatValue → formatChartValue (chartHelpers.ts)
//   getItemValue → getItemDisplayValue (chartHelpers.ts)
