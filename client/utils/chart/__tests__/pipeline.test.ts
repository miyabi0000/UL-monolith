import { describe, it, expect } from 'vitest'
import { prepareSortedChartData, buildOuterPieData } from '../pipeline'
import type { ChartData, GearItemWithCalculated } from '../../types'

const mkItem = (p: Partial<GearItemWithCalculated>): GearItemWithCalculated => ({
  id: 'i', userId: 'u', name: 'x',
  requiredQuantity: 1, ownedQuantity: 1,
  weightClass: 'base', weightConfidence: 'high', weightSource: 'manual',
  weightGrams: 100, priceCents: 1000, priority: 3, isInKit: true,
  createdAt: '', updatedAt: '',
  shortage: 0, totalWeight: 100, totalPrice: 1000, missingQuantity: 0,
  procurementStatus: 'owned',
  ...p,
})

const mkCategory = (name: string, weight: number, cost: number, items: GearItemWithCalculated[]): ChartData => ({
  name,
  value: weight,
  weight,
  cost,
  itemCount: items.length,
  color: '#888',
  items,
})

describe('prepareSortedChartData', () => {
  it('weight 降順にソートされる', () => {
    const data = [
      mkCategory('A', 100, 1000, []),
      mkCategory('C', 300, 3000, []),
      mkCategory('B', 200, 2000, []),
    ]
    const result = prepareSortedChartData(data, 'weight', 'all', 600, 'g')
    expect(result.map((c) => c.name)).toEqual(['C', 'B', 'A'])
  })

  it('cost モードでは cost 降順', () => {
    const data = [
      mkCategory('A', 100, 500, []),
      mkCategory('B', 10, 5000, []),
    ]
    const result = prepareSortedChartData(data, 'cost', 'all', 5500, '¥')
    expect(result.map((c) => c.name)).toEqual(['B', 'A'])
    expect(result[0].value).toBe(5000)
  })

  it('percentage = value / totalValue * 100 (四捨五入)', () => {
    const data = [
      mkCategory('A', 250, 0, []),
      mkCategory('B', 750, 0, []),
    ]
    const result = prepareSortedChartData(data, 'weight', 'all', 1000, 'g')
    expect(result[0].percentage).toBe(75)
    expect(result[1].percentage).toBe(25)
  })

  it('totalValue=0 で percentage=0', () => {
    const data = [mkCategory('A', 0, 0, [])]
    expect(prepareSortedChartData(data, 'weight', 'all', 0, 'g')[0].percentage).toBe(0)
  })

  it('sortedItems はアイテムを displayValue 降順でソート', () => {
    const items = [
      mkItem({ id: 'small', weightGrams: 100, requiredQuantity: 1 }),
      mkItem({ id: 'big', weightGrams: 500, requiredQuantity: 1 }),
      mkItem({ id: 'mid', weightGrams: 200, requiredQuantity: 1 }),
    ]
    const data = [mkCategory('X', 800, 0, items)]
    const result = prepareSortedChartData(data, 'weight', 'all', 800, 'g')
    expect(result[0].sortedItems.map((i) => i.id)).toEqual(['big', 'mid', 'small'])
  })

  it('displayValue=0 のアイテムはフィルタ', () => {
    const items = [
      mkItem({ id: 'visible', weightGrams: 100 }),
      mkItem({ id: 'zero', weightGrams: 0 }),
    ]
    const data = [mkCategory('X', 100, 0, items)]
    const result = prepareSortedChartData(data, 'weight', 'all', 100, 'g')
    expect(result[0].sortedItems.map((i) => i.id)).toEqual(['visible'])
  })
})

describe('buildOuterPieData', () => {
  const mkSorted = (items: Array<{ id: string; value: number }>) => ({
    name: 'X',
    value: items.reduce((s, i) => s + i.value, 0),
    weight: 0,
    cost: 0,
    itemCount: items.length,
    color: '#ff0000',
    items: [],
    percentage: 0,
    ratio: 0,
    label: 'X',
    unit: 'g',
    sortedItems: items.map((i) => ({
      ...mkItem({ id: i.id }),
      systemPercentage: 0,
      totalPercentage: 0,
      displayValue: i.value,
    })),
  })

  it('null 時は空配列', () => {
    expect(buildOuterPieData(null, 'g', '#000')).toEqual([])
  })

  it('items がゼロの時は空配列', () => {
    expect(buildOuterPieData(mkSorted([]), 'g', '#000')).toEqual([])
  })

  it('各アイテムに ratio = value/subtotal が計算される', () => {
    const result = buildOuterPieData(
      mkSorted([{ id: 'a', value: 30 }, { id: 'b', value: 70 }]),
      'g',
      '#000',
    )
    expect(result[0].ratio).toBeCloseTo(0.3)
    expect(result[1].ratio).toBeCloseTo(0.7)
  })

  it('color が generateItemColor で割り当てられる (ユニーク)', () => {
    const result = buildOuterPieData(
      mkSorted([{ id: 'a', value: 1 }, { id: 'b', value: 1 }, { id: 'c', value: 1 }]),
      'g',
      '#000',
    )
    const colors = result.map((r) => r.color)
    expect(new Set(colors).size).toBe(3)
  })

  it('unit がペイロードに含まれる', () => {
    const result = buildOuterPieData(mkSorted([{ id: 'a', value: 1 }]), '¥', '#000')
    expect(result[0].unit).toBe('¥')
  })
})
