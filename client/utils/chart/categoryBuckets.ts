import {
  GearItemWithCalculated,
  ChartData,
  QuantityDisplayMode,
} from '../types'
import { getCategoryColor } from '../designSystem'
import { getQuantityForDisplayMode } from './quantity'

/**
 * カテゴリ別の合計集計。
 *
 * 責務: ギアアイテム配列を category 名でグルーピングし、
 *       weight / price / count / items の合計を返す。
 */
export const calculateChartData = (
  items: GearItemWithCalculated[],
  mode: QuantityDisplayMode = 'owned',
): ChartData[] => {
  const buckets = items.reduce<Record<string, { weight: number; price: number; count: number; items: GearItemWithCalculated[]; color: string }>>((acc, item) => {
    const name  = item.category?.name  || 'Other'
    // Mondrian Matte: DB の category.color は無視し、name から決定論的に Mondrian パレット色を割当
    const color = getCategoryColor(name)
    if (!acc[name]) acc[name] = { weight: 0, price: 0, count: 0, items: [], color }

    const qty = getQuantityForDisplayMode(item, mode)
    acc[name].weight += (item.weightGrams || 0) * qty
    acc[name].price  += (item.priceCents  || 0) * qty
    acc[name].count  += qty
    acc[name].items.push(item)
    return acc
  }, {})

  return Object.entries(buckets).map(([name, b]) => ({
    name,
    value:     b.weight,
    weight:    b.weight,
    cost:      b.price,
    itemCount: b.count,
    color:     b.color,
    items:     b.items,
  }))
}

/** 全アイテムの重量/価格/数量/不足の合計 */
export const calculateTotals = (
  items: GearItemWithCalculated[],
  mode: QuantityDisplayMode = 'owned',
) =>
  items.reduce(
    (acc, item) => {
      const qty = getQuantityForDisplayMode(item, mode)
      return {
        weight:  acc.weight  + (item.weightGrams || 0) * qty,
        price:   acc.price   + (item.priceCents  || 0) * qty,
        items:   acc.items   + qty,
        missing: acc.missing + item.missingQuantity,
      }
    },
    { weight: 0, price: 0, items: 0, missing: 0 },
  )

/**
 * アイテム配列の重量合計。
 * mode 指定時はその数量で集計、未指定なら requiredQuantity。
 */
export const sumWeight = (
  items: GearItemWithCalculated[],
  mode?: QuantityDisplayMode,
): number =>
  items.reduce((sum, i) => {
    const qty = mode ? getQuantityForDisplayMode(i, mode) : i.requiredQuantity
    return sum + (i.weightGrams || 0) * qty
  }, 0)
