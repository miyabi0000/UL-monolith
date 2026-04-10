import { COLORS } from './designSystem'
import { ChartViewMode, QuantityDisplayMode, GearItemWithCalculated } from './types'
import { getQuantityForDisplayMode } from './chartHelpers'
import { formatWeight, WeightUnit } from './weightUnit'

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

// ==================== ヘルパー関数 ====================
export const formatValue = (value: number, mode: ChartViewMode, unit: WeightUnit = 'g'): string => {
  if (mode === 'cost') {
    return `¥${Math.round(value / 100).toLocaleString()}`
  }
  return formatWeight(value, unit)
}

export const getItemValue = (item: GearItemWithCalculated, viewMode: ChartViewMode, quantityMode: QuantityDisplayMode): number => {
  const quantity = getQuantityForDisplayMode(item, quantityMode)
  const unitValue = viewMode === 'cost' ? (item.priceCents || 0) : (item.weightGrams || 0)
  return unitValue * quantity
}
