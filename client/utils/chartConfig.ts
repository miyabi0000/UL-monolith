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
    mobile: 80,
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
    primary: { mobile: '1.1rem', desktop: '1.4rem' },      // 値表示
    secondary: { mobile: '0.65rem', desktop: '0.75rem' },   // ラベル
    tertiary: { mobile: '0.55rem', desktop: '0.65rem' }     // サブ情報
  },
  badge: { mobile: '0.5rem', desktop: '0.55rem' }
} as const

// ヘルパー関数は chartHelpers.ts に集約:
//   formatValue → formatChartValue (chartHelpers.ts)
//   getItemValue → getItemDisplayValue (chartHelpers.ts)
