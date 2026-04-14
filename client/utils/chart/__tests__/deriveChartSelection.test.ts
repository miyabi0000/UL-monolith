import { describe, it, expect } from 'vitest'
import { deriveChartSelection, SELECTION_NONE } from '../chartTypes'

describe('deriveChartSelection', () => {
  it('全て空 → none', () => {
    expect(deriveChartSelection([], null, null, 'all', false)).toEqual(SELECTION_NONE)
  })

  it('categories 1 件 → category', () => {
    const result = deriveChartSelection(['Shelter'], null, null, 'all', false)
    expect(result).toEqual({ kind: 'category', categoryName: 'Shelter' })
  })

  it('categories 2 件以上 → none (single 選択時のみ category 扱い)', () => {
    expect(deriveChartSelection(['A', 'B'], null, null, 'all', false)).toEqual(SELECTION_NONE)
  })

  it('selectedItem あり → item (category 名も保持)', () => {
    const result = deriveChartSelection(['Shelter'], 'item-1', 'Shelter', 'all', false)
    expect(result.kind).toBe('item')
    if (result.kind === 'item') {
      expect(result.itemId).toBe('item-1')
      expect(result.categoryName).toBe('Shelter')
    }
  })

  it('selectedItem あっても categoryName 不明なら item にしない', () => {
    const result = deriveChartSelection([], 'item-1', null, 'all', false)
    expect(result).toEqual(SELECTION_NONE)
  })

  it('weight-class モード × chartFocus=big3 → classFocus', () => {
    const result = deriveChartSelection([], null, null, 'big3', true)
    expect(result).toEqual({ kind: 'classFocus', focus: 'big3' })
  })

  it('weight-class モード × chartFocus=all → classFocus 扱いしない', () => {
    expect(deriveChartSelection([], null, null, 'all', true)).toEqual(SELECTION_NONE)
  })

  it('非 class モードでは chartFocus を無視', () => {
    expect(deriveChartSelection([], null, null, 'big3', false)).toEqual(SELECTION_NONE)
  })

  it('優先度: item > classFocus > category', () => {
    const itemResult = deriveChartSelection(['X'], 'i-1', 'X', 'big3', true)
    expect(itemResult.kind).toBe('item')

    const focusResult = deriveChartSelection(['X'], null, null, 'big3', true)
    expect(focusResult.kind).toBe('classFocus')

    const catResult = deriveChartSelection(['X'], null, null, 'all', true)
    expect(catResult.kind).toBe('category')
  })
})
