import {
  GearItemWithCalculated,
  ChartData,
  ChartViewMode,
  QuantityDisplayMode,
} from '../types'
import { generateItemColor } from '../colorHelpers'
import { getItemDisplayValue } from './quantity'

/**
 * 旧 GearChart 内の useMemo チェーンを抽出した純関数群。
 *
 * prepareSortedChartData: カテゴリ別ソート + percentage 計算
 * buildOuterPieData:      選択カテゴリ内のアイテム Pie データ構築
 */

export type ChartItemWithPercentages = GearItemWithCalculated & {
  systemPercentage: number
  totalPercentage:  number
  displayValue:     number
}

export type SortedChartCategory = ChartData & {
  value:        number
  percentage:   number
  ratio:        number
  label:        string
  unit:         string
  sortedItems:  ChartItemWithPercentages[]
}

export const prepareSortedChartData = (
  data: ChartData[],
  viewMode: ChartViewMode,
  quantityMode: QuantityDisplayMode,
  totalValue: number,
  payloadUnit: string,
): SortedChartCategory[] => {
  const withValue = data.map((c) => ({
    ...c,
    value: viewMode === 'cost' ? c.cost : c.weight,
  }))

  return [...withValue]
    .sort((a, b) => b.value - a.value)
    .map((category) => ({
      ...category,
      percentage: totalValue > 0 ? Math.round((category.value / totalValue) * 100) : 0,
      ratio:      totalValue > 0 ? category.value / totalValue : 0,
      label:      category.name,
      unit:       payloadUnit,
      sortedItems: (category.items || [])
        .map((item) => ({ item, itemValue: getItemDisplayValue(item, viewMode, quantityMode) }))
        .filter(({ itemValue }) => itemValue > 0)
        .sort((a, b) => b.itemValue - a.itemValue)
        .map(({ item, itemValue }) => ({
          ...item,
          systemPercentage: category.value > 0 ? Math.round((itemValue / category.value) * 100) : 0,
          totalPercentage:  totalValue > 0    ? Math.round((itemValue / totalValue)    * 100) : 0,
          displayValue:     itemValue,
        })) as ChartItemWithPercentages[],
    }))
}

export type OuterPieEntry = {
  id:               string
  name:             string
  label:            string
  value:            number
  color:            string
  brand?:           string
  ownedQuantity:    number
  requiredQuantity: number
  shortage:         number
  priority:         number
  percentage:       number
  systemPercentage: number
  ratio:            number
  unit:             string
}

export const buildOuterPieData = (
  selected: SortedChartCategory | null | undefined,
  payloadUnit: string,
  defaultColor: string,
): OuterPieEntry[] => {
  const items    = selected?.sortedItems || []
  const subtotal = items.reduce((s, item) => s + item.displayValue, 0)
  const base     = selected?.color || defaultColor
  const total    = selected?.sortedItems?.length || 1

  return items.map((item, index) => ({
    id:               item.id,
    name:             item.name,
    label:            item.name,
    value:            item.displayValue,
    color:            generateItemColor(base, index, total),
    brand:            item.brand,
    ownedQuantity:    item.ownedQuantity,
    requiredQuantity: item.requiredQuantity,
    shortage:         item.shortage,
    priority:         item.priority,
    percentage:       item.totalPercentage,
    systemPercentage: item.systemPercentage,
    ratio:            subtotal > 0 ? item.displayValue / subtotal : 0,
    unit:             payloadUnit,
  }))
}
