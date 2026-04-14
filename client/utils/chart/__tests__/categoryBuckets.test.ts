import { describe, it, expect } from 'vitest'
import { calculateChartData, calculateTotals, sumWeight } from '../categoryBuckets'
import type { GearItemWithCalculated, Category } from '../../types'

const mkCategory = (name: string): Category => ({
  id: name.toLowerCase(),
  name,
  path: [name],
  color: '#888',
  tags: [],
  createdAt: '',
})

const mkItem = (partial: Partial<GearItemWithCalculated>): GearItemWithCalculated => ({
  id: 'i',
  userId: 'u',
  name: 'x',
  requiredQuantity: 1,
  ownedQuantity: 1,
  weightClass: 'base',
  weightConfidence: 'high',
  weightSource: 'manual',
  weightGrams: 100,
  priceCents: 1000,
  priority: 3,
  isInKit: true,
  createdAt: '',
  updatedAt: '',
  shortage: 0,
  totalWeight: 100,
  totalPrice: 1000,
  missingQuantity: 0,
  procurementStatus: 'owned',
  ...partial,
})

describe('calculateChartData', () => {
  it('カテゴリごとに集計される', () => {
    const result = calculateChartData(
      [
        mkItem({ id: 'a', category: mkCategory('Shelter'), weightGrams: 500, priceCents: 10000 }),
        mkItem({ id: 'b', category: mkCategory('Shelter'), weightGrams: 300, priceCents: 5000 }),
        mkItem({ id: 'c', category: mkCategory('Cooking'), weightGrams: 200, priceCents: 2000 }),
      ],
      'owned',
    )
    expect(result).toHaveLength(2)
    const shelter = result.find((r) => r.name === 'Shelter')
    expect(shelter?.weight).toBe(800)
    expect(shelter?.cost).toBe(15000)
    expect(shelter?.itemCount).toBe(2)
  })

  it('category が無いアイテムは "Other"', () => {
    const result = calculateChartData([mkItem({ category: undefined })], 'owned')
    expect(result[0].name).toBe('Other')
  })

  it('quantityDisplayMode で数量が変わる', () => {
    const item = mkItem({ ownedQuantity: 2, requiredQuantity: 5, weightGrams: 100, category: mkCategory('X') })
    expect(calculateChartData([item], 'owned')[0].weight).toBe(200)   // 100 × 2
    expect(calculateChartData([item], 'all')[0].weight).toBe(500)     // 100 × 5
    expect(calculateChartData([item], 'need')[0].weight).toBe(300)    // 100 × 3
  })
})

describe('calculateTotals', () => {
  it('全アイテムの weight/price/items/missing を合算', () => {
    const items = [
      mkItem({ weightGrams: 100, priceCents: 1000, requiredQuantity: 2, ownedQuantity: 2, missingQuantity: 0 }),
      mkItem({ weightGrams: 200, priceCents: 2000, requiredQuantity: 1, ownedQuantity: 0, missingQuantity: 1 }),
    ]
    const totals = calculateTotals(items, 'all')
    expect(totals.weight).toBe(400)   // 100×2 + 200×1
    expect(totals.price).toBe(4000)   // 1000×2 + 2000×1
    expect(totals.items).toBe(3)      // 2 + 1
    expect(totals.missing).toBe(1)    // 0 + 1
  })
})

describe('sumWeight', () => {
  it('mode 未指定は requiredQuantity で集計', () => {
    const items = [
      mkItem({ weightGrams: 100, requiredQuantity: 3 }),
      mkItem({ weightGrams: 50, requiredQuantity: 2 }),
    ]
    expect(sumWeight(items)).toBe(400)
  })

  it('mode 指定時はそれに従う', () => {
    const item = mkItem({ weightGrams: 100, requiredQuantity: 5, ownedQuantity: 1 })
    expect(sumWeight([item], 'owned')).toBe(100)
    expect(sumWeight([item], 'all')).toBe(500)
    expect(sumWeight([item], 'need')).toBe(400)
  })
})
