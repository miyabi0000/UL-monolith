/**
 * @deprecated 新規コードは `utils/chart/*` から直接 import してください。
 *
 * このファイルは後方互換のための barrel re-export。
 * 責務別の分割先:
 *   quantity.ts         — getQuantityForDisplayMode / getItemDisplayValue
 *   formatters.ts       — formatChartValue / formatChartAxisValue / getPayloadUnit
 *   categoryBuckets.ts  — calculateChartData / calculateTotals / sumWeight
 *   dualRing.ts         — filterByScope / calculateInnerRingData / calculateBig3Breakdown / calculateCategoryBreakdown / calculateOuterRingData
 *   pipeline.ts         — prepareSortedChartData / buildOuterPieData (+ 型)
 */

export {
  getQuantityForDisplayMode,
  getItemDisplayValue,
} from './chart/quantity'

export {
  formatChartValue,
  formatChartAxisValue,
  getPayloadUnit,
} from './chart/formatters'

export {
  calculateChartData,
  calculateTotals,
  sumWeight,
} from './chart/categoryBuckets'

export {
  filterByScope,
  calculateInnerRingData,
  calculateBig3Breakdown,
  calculateCategoryBreakdown,
  calculateOuterRingData,
} from './chart/dualRing'

export {
  prepareSortedChartData,
  buildOuterPieData,
  type ChartItemWithPercentages,
  type SortedChartCategory,
  type OuterPieEntry,
} from './chart/pipeline'
