import { useCallback, useReducer } from 'react'
import type { ChartSelection, ItemId } from '../../../utils/chart/chartTypes'
import { SELECTION_NONE } from '../../../utils/chart/chartTypes'

/**
 * Chart 選択状態を一箇所で管理する reducer。
 *
 * 旧来の selectedCategoryFromChart / selectedItem / chartFocus を 1 union に統合し、
 * kind フィールドで網羅判定可能にする。
 */

type Action =
  | { type: 'SELECT_CATEGORY'; categoryName: string }
  | { type: 'TOGGLE_CATEGORY'; categoryName: string }
  | { type: 'SELECT_ITEM';     itemId: ItemId; categoryName: string }
  | { type: 'TOGGLE_ITEM';     itemId: ItemId; categoryName: string }
  | { type: 'TOGGLE_FOCUS';    focus: 'big3' | 'other' }
  | { type: 'CLEAR' }

export const chartSelectionReducer = (state: ChartSelection, action: Action): ChartSelection => {
  switch (action.type) {
    case 'SELECT_CATEGORY':
      return { kind: 'category', categoryName: action.categoryName }

    case 'TOGGLE_CATEGORY':
      if (state.kind === 'category' && state.categoryName === action.categoryName) {
        return SELECTION_NONE
      }
      return { kind: 'category', categoryName: action.categoryName }

    case 'SELECT_ITEM':
      return { kind: 'item', itemId: action.itemId, categoryName: action.categoryName }

    case 'TOGGLE_ITEM':
      if (state.kind === 'item' && state.itemId === action.itemId) {
        return SELECTION_NONE
      }
      return { kind: 'item', itemId: action.itemId, categoryName: action.categoryName }

    case 'TOGGLE_FOCUS':
      if (state.kind === 'classFocus' && state.focus === action.focus) {
        return SELECTION_NONE
      }
      return { kind: 'classFocus', focus: action.focus }

    case 'CLEAR':
      return SELECTION_NONE
  }
}

export const useChartSelection = (initial: ChartSelection = SELECTION_NONE) => {
  const [selection, dispatch] = useReducer(chartSelectionReducer, initial)

  const selectCategory = useCallback((name: string) => dispatch({ type: 'SELECT_CATEGORY', categoryName: name }), [])
  const toggleCategory = useCallback((name: string) => dispatch({ type: 'TOGGLE_CATEGORY', categoryName: name }), [])
  const selectItem     = useCallback((id: ItemId, name: string) => dispatch({ type: 'SELECT_ITEM', itemId: id, categoryName: name }), [])
  const toggleItem     = useCallback((id: ItemId, name: string) => dispatch({ type: 'TOGGLE_ITEM', itemId: id, categoryName: name }), [])
  const toggleFocus    = useCallback((focus: 'big3' | 'other') => dispatch({ type: 'TOGGLE_FOCUS', focus }), [])
  const clear          = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  return { selection, selectCategory, toggleCategory, selectItem, toggleItem, toggleFocus, clear }
}
