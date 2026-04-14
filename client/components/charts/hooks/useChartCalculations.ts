import { useMemo } from 'react'
import {
  calculateInnerRingData,
  calculateOuterRingData,
  prepareSortedChartData,
  buildOuterPieData,
  getPayloadUnit,
} from '../../../utils/chartHelpers'
import { generateItemColor } from '../../../utils/colorHelpers'
import type {
  ChartData,
  ChartViewMode,
  ChartFocus,
  ChartScope,
  GearItemWithCalculated,
  Category,
  QuantityDisplayMode,
  DonutSegment,
} from '../../../utils/types'
import type { OuterPieEntry, SortedChartCategory } from '../../../utils/chart/pipeline'
import type { WeightUnit } from '../../../utils/weightUnit'
import type { BarItem } from '../HorizontalBarChart'

interface UseChartCalculationsArgs {
  data: ChartData[]
  analysisItems: GearItemWithCalculated[]
  categories: Category[]
  viewMode: ChartViewMode
  quantityDisplayMode: QuantityDisplayMode
  selectedCategories: string[]
  selectedItem: string | null
  chartFocus: ChartFocus
  chartScope: ChartScope
  totalWeight: number
  totalCost: number
  weightUnit: WeightUnit
  defaultColor: string
}

export interface ChartCalculations {
  totalValue: number
  payloadUnit: string
  sortedData: SortedChartCategory[]
  selectedCategoryFromChart: string | null
  selectedData: SortedChartCategory | null
  outerPieData: OuterPieEntry[]
  selectedItemData: OuterPieEntry | null
  barData: BarItem[]
  dualRingInnerData: (DonutSegment & { ratio: number; unit: WeightUnit })[] | null
  dualRingOuterData: (DonutSegment & { ratio: number; unit: WeightUnit })[] | null
}

/**
 * ChartPanel から useMemo チェーンを切り出した派生データフック。
 *
 * 責務: 入力 (items / categories / mode) から下流コンポーネントが必要とする
 *       全派生データを 1 オブジェクトで返す。useMemo 依存の管理を集約。
 */
export const useChartCalculations = ({
  data,
  analysisItems,
  categories,
  viewMode,
  quantityDisplayMode,
  selectedCategories,
  selectedItem,
  chartFocus,
  chartScope,
  totalWeight,
  totalCost,
  weightUnit,
  defaultColor,
}: UseChartCalculationsArgs): ChartCalculations => {
  const totalValue  = viewMode === 'cost' ? totalCost : totalWeight
  const payloadUnit = getPayloadUnit(viewMode, weightUnit)

  const dualRingInnerData = useMemo(() => {
    if (viewMode !== 'weight-class') return null
    const segments = calculateInnerRingData(analysisItems, chartScope)
    const total    = segments.reduce((sum, s) => sum + s.value, 0)
    return segments.map((s) => ({ ...s, ratio: total > 0 ? s.value / total : 0, unit: weightUnit }))
  }, [viewMode, analysisItems, chartScope, weightUnit])

  const dualRingOuterData = useMemo(() => {
    if (viewMode !== 'weight-class') return null
    const segments = calculateOuterRingData(analysisItems, chartScope, chartFocus)
    const total    = segments.reduce((sum, s) => sum + s.value, 0)
    return segments.map((s) => ({ ...s, ratio: total > 0 ? s.value / total : 0, unit: weightUnit }))
    // categories は名前ベースで色決定に間接的に影響する
  }, [viewMode, analysisItems, chartScope, chartFocus, categories, weightUnit])

  const sortedData = useMemo(
    () => prepareSortedChartData(data, viewMode, quantityDisplayMode, totalValue, payloadUnit),
    [data, viewMode, quantityDisplayMode, totalValue, payloadUnit],
  )

  const selectedCategoryFromChart = selectedCategories.length === 1 ? selectedCategories[0] : null
  const selectedData = useMemo(
    () => (selectedCategoryFromChart ? sortedData.find((d) => d.name === selectedCategoryFromChart) ?? null : null),
    [sortedData, selectedCategoryFromChart],
  )

  const outerPieData = useMemo(
    () => buildOuterPieData(selectedData, payloadUnit, defaultColor),
    [selectedData, payloadUnit, defaultColor],
  )

  const selectedItemData = useMemo(
    () => (selectedItem ? outerPieData.find((item) => item.id === selectedItem) ?? null : null),
    [selectedItem, outerPieData],
  )

  const barData = useMemo<BarItem[]>(() => {
    if (selectedData && selectedData.sortedItems.length > 0) {
      return selectedData.sortedItems.map((item, index) => ({
        id:         item.id,
        name:       item.name,
        value:      item.displayValue,
        color:      generateItemColor(selectedData.color, index, selectedData.sortedItems.length),
        percentage: item.systemPercentage,
        unit:       payloadUnit,
      }))
    }
    return sortedData.map((cat) => ({
      name:       cat.name,
      value:      cat.value,
      color:      cat.color,
      percentage: cat.percentage,
      unit:       payloadUnit,
    }))
  }, [selectedData, sortedData, payloadUnit])

  return {
    totalValue,
    payloadUnit,
    sortedData,
    selectedCategoryFromChart,
    selectedData,
    outerPieData,
    selectedItemData,
    barData,
    dualRingInnerData,
    dualRingOuterData,
  }
}
