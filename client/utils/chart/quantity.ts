import { GearItemWithCalculated, QuantityDisplayMode, ChartViewMode } from '../types'

/**
 * QuantityDisplayMode に応じた数量取得。
 * - owned: 所持数
 * - need:  不足分 (required - owned、下限 0)
 * - all:   必要数 (required)
 */
export const getQuantityForDisplayMode = (
  item: GearItemWithCalculated,
  mode: QuantityDisplayMode,
): number => {
  if (mode === 'owned') return item.ownedQuantity
  if (mode === 'all')   return item.requiredQuantity
  return Math.max(0, item.requiredQuantity - item.ownedQuantity)
}

/** 1 アイテムあたりの表示値 (weight or cost × 数量) */
export const getItemDisplayValue = (
  item: GearItemWithCalculated,
  viewMode: ChartViewMode,
  mode: QuantityDisplayMode,
): number => {
  const qty       = getQuantityForDisplayMode(item, mode)
  const unitValue = viewMode === 'cost' ? (item.priceCents || 0) : (item.weightGrams || 0)
  return unitValue * qty
}
