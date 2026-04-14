import { describe, it, expect } from 'vitest'
import { chartSelectionReducer } from '../useChartSelection'
import { SELECTION_NONE, asItemId } from '../../../../utils/chart/chartTypes'

describe('chartSelectionReducer', () => {
  it('初期状態は none', () => {
    expect(SELECTION_NONE).toEqual({ kind: 'none' })
  })

  describe('SELECT_CATEGORY', () => {
    it('任意の状態から category に遷移', () => {
      const result = chartSelectionReducer(SELECTION_NONE, {
        type: 'SELECT_CATEGORY',
        categoryName: 'Shelter',
      })
      expect(result).toEqual({ kind: 'category', categoryName: 'Shelter' })
    })
  })

  describe('TOGGLE_CATEGORY', () => {
    it('none → category', () => {
      const r = chartSelectionReducer(SELECTION_NONE, { type: 'TOGGLE_CATEGORY', categoryName: 'X' })
      expect(r.kind).toBe('category')
    })

    it('同じ category をトグルすると none', () => {
      const state = { kind: 'category', categoryName: 'X' } as const
      const r = chartSelectionReducer(state, { type: 'TOGGLE_CATEGORY', categoryName: 'X' })
      expect(r).toEqual(SELECTION_NONE)
    })

    it('別 category をトグルすると切替', () => {
      const state = { kind: 'category', categoryName: 'X' } as const
      const r = chartSelectionReducer(state, { type: 'TOGGLE_CATEGORY', categoryName: 'Y' })
      expect(r).toEqual({ kind: 'category', categoryName: 'Y' })
    })
  })

  describe('TOGGLE_ITEM', () => {
    const id1 = asItemId('item-1')
    const id2 = asItemId('item-2')

    it('同じ item をトグルすると none', () => {
      const state = { kind: 'item', itemId: id1, categoryName: 'C' } as const
      const r = chartSelectionReducer(state, { type: 'TOGGLE_ITEM', itemId: id1, categoryName: 'C' })
      expect(r).toEqual(SELECTION_NONE)
    })

    it('別 item をトグルすると切替', () => {
      const state = { kind: 'item', itemId: id1, categoryName: 'C' } as const
      const r = chartSelectionReducer(state, { type: 'TOGGLE_ITEM', itemId: id2, categoryName: 'C' })
      expect(r.kind).toBe('item')
      if (r.kind === 'item') expect(r.itemId).toBe(id2)
    })
  })

  describe('TOGGLE_FOCUS', () => {
    it('同じ focus を再度押すと none', () => {
      const state = { kind: 'classFocus', focus: 'big3' } as const
      const r = chartSelectionReducer(state, { type: 'TOGGLE_FOCUS', focus: 'big3' })
      expect(r).toEqual(SELECTION_NONE)
    })

    it('別 focus に切替', () => {
      const state = { kind: 'classFocus', focus: 'big3' } as const
      const r = chartSelectionReducer(state, { type: 'TOGGLE_FOCUS', focus: 'other' })
      expect(r).toEqual({ kind: 'classFocus', focus: 'other' })
    })
  })

  describe('CLEAR', () => {
    it('任意の状態から none に遷移', () => {
      const cases = [
        SELECTION_NONE,
        { kind: 'category' as const, categoryName: 'X' },
        { kind: 'item' as const, itemId: asItemId('x'), categoryName: 'C' },
        { kind: 'classFocus' as const, focus: 'big3' as const },
      ]
      for (const state of cases) {
        expect(chartSelectionReducer(state, { type: 'CLEAR' })).toEqual(SELECTION_NONE)
      }
    })
  })
})
