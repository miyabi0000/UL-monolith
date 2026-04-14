import {
  GearItemWithCalculated,
  ChartScope,
  ChartFocus,
  DonutSegment,
  isBig3Category,
  DUAL_RING_COLORS,
} from '../types'
import { COLORS } from '../designSystem'
import { sumWeight } from './categoryBuckets'

/**
 * weight-class モード専用: 二重ドーナツのデータ構築。
 *
 * 責務: scope (base/packed/skinout) フィルタ + focus に応じた内訳計算。
 */

/** scope に基づいてアイテムをフィルタ */
export const filterByScope = (
  items: GearItemWithCalculated[],
  scope: ChartScope,
): GearItemWithCalculated[] => {
  switch (scope) {
    case 'base':
      return items.filter((i) => i.weightClass === 'base' || !i.weightClass)
    case 'packed':
      return items.filter((i) => i.weightClass === 'base' || i.weightClass === 'consumable' || !i.weightClass)
    case 'skinout':
      return items
  }
}

/** Inner ring: Big3 vs Other */
export const calculateInnerRingData = (
  items: GearItemWithCalculated[],
  scope: ChartScope,
): DonutSegment[] => {
  const scoped = filterByScope(items, scope)
  const big3   = scoped.filter((i) => isBig3Category(i.category))
  const other  = scoped.filter((i) => !isBig3Category(i.category))

  return [
    { id: 'big3',  label: 'Big3',  value: sumWeight(big3),  color: DUAL_RING_COLORS.big3,  isBig3: true,  items: big3 },
    { id: 'other', label: 'Other', value: sumWeight(other), color: DUAL_RING_COLORS.other, isBig3: false, items: other },
  ].filter((s) => s.value > 0)
}

/** Big3 内訳: Pack / Shelter / Sleep */
export const calculateBig3Breakdown = (items: GearItemWithCalculated[]): DonutSegment[] => {
  const big3 = items.filter((i) => isBig3Category(i.category))
  const byTag = (tag: 'big3_pack' | 'big3_shelter' | 'big3_sleep') =>
    big3.filter((i) => i.category?.tags?.includes(tag))

  const pack    = byTag('big3_pack')
  const shelter = byTag('big3_shelter')
  const sleep   = byTag('big3_sleep')

  return [
    { id: 'big3_pack',    label: 'Pack',    value: sumWeight(pack),    color: DUAL_RING_COLORS.big3_pack,    isBig3: true, items: pack },
    { id: 'big3_shelter', label: 'Shelter', value: sumWeight(shelter), color: DUAL_RING_COLORS.big3_shelter, isBig3: true, items: shelter },
    { id: 'big3_sleep',   label: 'Sleep',   value: sumWeight(sleep),   color: DUAL_RING_COLORS.big3_sleep,   isBig3: true, items: sleep },
  ].filter((s) => s.value > 0)
}

/** カテゴリ別内訳 (重量降順)
 * Mondrian Matte: カテゴリ色は無視し、Big3 = Mondrian Red、その他 = グレー濃淡を index 順に割当
 */
export const calculateCategoryBreakdown = (items: GearItemWithCalculated[]): DonutSegment[] => {
  const byCategory = new Map<string, { items: GearItemWithCalculated[]; name: string; isBig3: boolean }>()

  for (const item of items) {
    const id = item.categoryId || 'uncategorized'
    if (!byCategory.has(id)) {
      byCategory.set(id, {
        items: [],
        name:  item.category?.name  || 'Other',
        isBig3: isBig3Category(item.category),
      })
    }
    byCategory.get(id)!.items.push(item)
  }

  // 重量降順でソートしてから index ベースのグレー階調を割当
  const sorted = Array.from(byCategory.entries())
    .map(([id, bucket]) => ({
      id,
      label:  bucket.name,
      value:  sumWeight(bucket.items),
      isBig3: bucket.isBig3,
      items:  bucket.items,
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)

  // グレー濃→薄 (gray800 → gray300) を index 順に。Big3 のみ Mondrian Red で上書き
  const palette = [COLORS.gray[800], COLORS.gray[600], COLORS.gray[400], COLORS.gray[700], COLORS.gray[500], COLORS.gray[300]]
  return sorted.map((seg, index) => ({
    ...seg,
    color: seg.isBig3 ? '#D7282F' : palette[index % palette.length],
  }))
}

/** Outer ring: focus に応じてカテゴリ or Big3 内訳を返す */
export const calculateOuterRingData = (
  items: GearItemWithCalculated[],
  scope: ChartScope,
  focus: ChartFocus,
): DonutSegment[] => {
  const scoped = filterByScope(items, scope)
  if (focus === 'big3')  return calculateBig3Breakdown(scoped)
  if (focus === 'other') return calculateCategoryBreakdown(scoped.filter((i) => !isBig3Category(i.category)))
  return calculateCategoryBreakdown(scoped)
}
