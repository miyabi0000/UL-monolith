import { describe, it, expect } from 'vitest'
import {
  filterByScope,
  calculateInnerRingData,
  calculateBig3Breakdown,
  calculateCategoryBreakdown,
  calculateOuterRingData,
} from '../dualRing'
import type { GearItemWithCalculated, Category, WeightClass } from '../../types'

const mkCat = (name: string, tags: string[] = []): Category => ({
  id: name.toLowerCase(),
  name,
  path: [name],
  color: '#888',
  tags,
  createdAt: '',
})

const mkItem = (p: {
  id: string
  weightClass?: WeightClass
  category?: Category
  weightGrams?: number
  required?: number
}): GearItemWithCalculated => ({
  id: p.id,
  userId: 'u',
  name: p.id,
  categoryId: p.category?.id,
  requiredQuantity: p.required ?? 1,
  ownedQuantity: 1,
  weightClass: p.weightClass ?? 'base',
  weightConfidence: 'high',
  weightSource: 'manual',
  weightGrams: p.weightGrams ?? 100,
  priceCents: 0,
  priority: 3,
  isInKit: true,
  createdAt: '',
  updatedAt: '',
  shortage: 0,
  totalWeight: 0,
  totalPrice: 0,
  missingQuantity: 0,
  procurementStatus: 'owned',
  category: p.category,
})

describe('filterByScope', () => {
  const items = [
    mkItem({ id: 'base1', weightClass: 'base' }),
    mkItem({ id: 'worn1', weightClass: 'worn' }),
    mkItem({ id: 'cons1', weightClass: 'consumable' }),
  ]

  it('base は base クラスのみ', () => {
    const result = filterByScope(items, 'base')
    expect(result.map((i) => i.id)).toEqual(['base1'])
  })

  it('packed は base + consumable', () => {
    const result = filterByScope(items, 'packed')
    expect(result.map((i) => i.id).sort()).toEqual(['base1', 'cons1'])
  })

  it('skinout は全て', () => {
    expect(filterByScope(items, 'skinout')).toEqual(items)
  })

  it('weightClass 未設定は base 扱い (base scope に含まれる)', () => {
    const item = { ...mkItem({ id: 'x' }), weightClass: undefined } as unknown as GearItemWithCalculated
    const result = filterByScope([item], 'base')
    expect(result).toHaveLength(1)
  })
})

describe('calculateInnerRingData', () => {
  it('Big3 カテゴリと Other に分離', () => {
    const items = [
      mkItem({ id: 'pack',  category: mkCat('Pack',    ['big3_pack']),    weightGrams: 1000 }),
      mkItem({ id: 'stove', category: mkCat('Cooking', []),               weightGrams: 200  }),
    ]
    const result = calculateInnerRingData(items, 'base')
    const big3  = result.find((s) => s.id === 'big3')
    const other = result.find((s) => s.id === 'other')
    expect(big3?.value).toBe(1000)
    expect(other?.value).toBe(200)
  })

  it('value=0 のセグメントは除外', () => {
    const items = [mkItem({ id: 'pack', category: mkCat('Pack', ['big3_pack']), weightGrams: 1000 })]
    const result = calculateInnerRingData(items, 'base')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('big3')
  })
})

describe('calculateBig3Breakdown', () => {
  it('Pack / Shelter / Sleep に分離', () => {
    const items = [
      mkItem({ id: 'p', category: mkCat('Pack',    ['big3_pack']),    weightGrams: 1000 }),
      mkItem({ id: 's', category: mkCat('Shelter', ['big3_shelter']), weightGrams: 500  }),
      mkItem({ id: 'z', category: mkCat('Sleep',   ['big3_sleep']),   weightGrams: 300  }),
    ]
    const result = calculateBig3Breakdown(items)
    expect(result.map((s) => s.id).sort()).toEqual(['big3_pack', 'big3_shelter', 'big3_sleep'])
    expect(result.find((s) => s.id === 'big3_pack')?.value).toBe(1000)
  })

  it('Big3 以外のカテゴリは無視', () => {
    const items = [
      mkItem({ id: 'p', category: mkCat('Pack', ['big3_pack']), weightGrams: 1000 }),
      mkItem({ id: 'x', category: mkCat('Other', []),           weightGrams: 500  }),
    ]
    const result = calculateBig3Breakdown(items)
    expect(result).toHaveLength(1)
  })
})

describe('calculateCategoryBreakdown', () => {
  it('weight 降順で並ぶ', () => {
    const items = [
      mkItem({ id: 'a', category: mkCat('A'), weightGrams: 100 }),
      mkItem({ id: 'b', category: mkCat('B'), weightGrams: 500 }),
      mkItem({ id: 'c', category: mkCat('C'), weightGrams: 300 }),
    ]
    const result = calculateCategoryBreakdown(items)
    expect(result.map((s) => s.label)).toEqual(['B', 'C', 'A'])
  })

  it('同カテゴリの weight を合算', () => {
    const cat = mkCat('Shelter')
    const items = [
      mkItem({ id: 'a', category: cat, weightGrams: 200 }),
      mkItem({ id: 'b', category: cat, weightGrams: 300 }),
    ]
    const result = calculateCategoryBreakdown(items)
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe(500)
  })
})

describe('calculateOuterRingData', () => {
  const items = [
    mkItem({ id: 'p1', category: mkCat('Pack',    ['big3_pack']),    weightGrams: 1000 }),
    mkItem({ id: 'p2', category: mkCat('Shelter', ['big3_shelter']), weightGrams: 500  }),
    mkItem({ id: 'x',  category: mkCat('Other',   []),               weightGrams: 200  }),
  ]

  it('focus=all → カテゴリ別 breakdown', () => {
    const result = calculateOuterRingData(items, 'skinout', 'all')
    expect(result.map((s) => s.label).sort()).toEqual(['Other', 'Pack', 'Shelter'])
  })

  it('focus=big3 → Big3 内訳のみ', () => {
    const result = calculateOuterRingData(items, 'skinout', 'big3')
    expect(result.every((s) => s.id.startsWith('big3_'))).toBe(true)
  })

  it('focus=other → Big3 以外のカテゴリ', () => {
    const result = calculateOuterRingData(items, 'skinout', 'other')
    expect(result.map((s) => s.label)).toEqual(['Other'])
  })
})
