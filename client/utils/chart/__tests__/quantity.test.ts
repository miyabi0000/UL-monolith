import { describe, it, expect } from 'vitest'
import { getQuantityForDisplayMode, getItemDisplayValue } from '../quantity'
import type { GearItemWithCalculated } from '../../types'

const makeItem = (partial: Partial<GearItemWithCalculated> = {}): GearItemWithCalculated => ({
  id: 'i1',
  userId: 'u1',
  name: 'Tent',
  requiredQuantity: 5,
  ownedQuantity: 3,
  weightClass: 'base',
  weightConfidence: 'high',
  weightSource: 'manual',
  weightGrams: 1000,
  priceCents: 50000,
  priority: 3,
  isInKit: true,
  createdAt: '',
  updatedAt: '',
  shortage: 2,
  totalWeight: 5000,
  totalPrice: 250000,
  missingQuantity: 2,
  procurementStatus: 'partial',
  ...partial,
})

describe('getQuantityForDisplayMode', () => {
  it('owned → 所持数', () => {
    expect(getQuantityForDisplayMode(makeItem(), 'owned')).toBe(3)
  })

  it('all → 必要数', () => {
    expect(getQuantityForDisplayMode(makeItem(), 'all')).toBe(5)
  })

  it('need → 不足分 (required - owned)', () => {
    expect(getQuantityForDisplayMode(makeItem(), 'need')).toBe(2)
  })

  it('need で負にならない (下限 0)', () => {
    const overOwned = makeItem({ requiredQuantity: 2, ownedQuantity: 5 })
    expect(getQuantityForDisplayMode(overOwned, 'need')).toBe(0)
  })
})

describe('getItemDisplayValue', () => {
  it('weight mode × owned → weightGrams × owned', () => {
    expect(getItemDisplayValue(makeItem(), 'weight', 'owned')).toBe(3000)
  })

  it('cost mode × all → priceCents × required', () => {
    expect(getItemDisplayValue(makeItem(), 'cost', 'all')).toBe(250000)
  })

  it('weightGrams 未設定は 0 扱い', () => {
    expect(getItemDisplayValue(makeItem({ weightGrams: undefined }), 'weight', 'all')).toBe(0)
  })

  it('priceCents 未設定は 0 扱い', () => {
    expect(getItemDisplayValue(makeItem({ priceCents: undefined }), 'cost', 'all')).toBe(0)
  })
})
