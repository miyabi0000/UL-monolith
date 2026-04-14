import { ChartViewMode } from '../types'
import { convertFromGrams, formatWeight, WeightUnit } from '../weightUnit'

/**
 * チャート値の統一フォーマット。
 *
 * compact=false (デフォルト): そのままの値 (例: "420g", "¥12,000")
 * compact=true:  軸ラベル用のコンパクト化 (例: "1.5kg", "¥1.2万", "2.3lb")
 */
export const formatChartValue = (
  value: number,
  viewMode: ChartViewMode,
  unit: WeightUnit = 'g',
  options: { compact?: boolean } = {},
): string => {
  const { compact = false } = options
  if (viewMode === 'cost') {
    const yen = Math.round(value / 100)
    if (compact && yen >= 10000) return `¥${(yen / 10000).toFixed(1)}万`
    return `¥${yen.toLocaleString()}`
  }
  if (compact) {
    if (unit === 'oz') {
      const oz = convertFromGrams(value, 'oz')
      return oz >= 16 ? `${(oz / 16).toFixed(1)}lb` : `${oz}oz`
    }
    return value >= 1000 ? `${(value / 1000).toFixed(1)}kg` : `${value}g`
  }
  return formatWeight(value, unit)
}

/** @deprecated formatChartValue(..., { compact: true }) を使ってください */
export const formatChartAxisValue = (value: number, viewMode: ChartViewMode, unit: WeightUnit = 'g'): string =>
  formatChartValue(value, viewMode, unit, { compact: true })

/** チャート payload に載せる単位記号 (cost は ¥、それ以外は g/oz) */
export const getPayloadUnit = (viewMode: ChartViewMode, unit: WeightUnit): string =>
  viewMode === 'cost' ? '¥' : unit
