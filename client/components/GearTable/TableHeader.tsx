import React from 'react'
import type { QuantityDisplayMode } from '../../utils/types'
import { COLORS } from '../../utils/designSystem'

export type SortField = 'name' | 'category' | 'weight' | 'shortage' | 'priority' | 'price' | 'owned' | 'required' | 'season'
export type SortDirection = 'asc' | 'desc'
export type Currency = 'JPY' | 'USD'

interface TableHeaderProps {
  showCheckboxes: boolean
  isAllSelected: boolean
  isPartiallySelected: boolean
  sortField: SortField
  sortDirection: SortDirection
  quantityDisplayMode: QuantityDisplayMode
  currency?: Currency
  onSelectAll: (checked: boolean) => void
  onSort: (field: SortField) => void
  onQuantityDisplayModeChange: () => void
  onCurrencyChange?: () => void
  showEditColumn?: boolean
  /** 編集モード中はソートを無効化 */
  isEditable?: boolean
}

const TableHeader: React.FC<TableHeaderProps> = ({
  showCheckboxes,
  isAllSelected,
  isPartiallySelected,
  sortField,
  sortDirection,
  quantityDisplayMode,
  currency = 'JPY',
  onSelectAll,
  onSort,
  onQuantityDisplayModeChange,
  onCurrencyChange,
  showEditColumn = false,
  isEditable = false
}) => {
  // 編集モード中はソートを無効化
  const handleSort = (field: SortField) => {
    if (isEditable) return
    onSort(field)
  }

  // ソート可能なヘッダーのスタイル
  const sortableHeaderClass = isEditable
    ? 'text-gray-400 cursor-default'
    : 'text-gray-600 cursor-pointer hover:bg-gray-100'
  const headerBase = 'px-2 py-2 font-medium text-[11px] tracking-[0.04em] border-b border-gray-200 border-r last:border-r-0'
  const getStatusFilterLabel = () => {
    switch (quantityDisplayMode) {
      case 'owned': return 'OWN'
      case 'need': return 'NEED'
      case 'all': return 'ALL'
      default: return 'ALL'
    }
  }
  const getStatusFilterColor = () => {
    switch (quantityDisplayMode) {
      case 'owned': return COLORS.success
      case 'need': return COLORS.error
      case 'all': return COLORS.gray[500]
      default: return COLORS.gray[500]
    }
  }
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return (
      <span className="ml-1 text-[10px] text-gray-600">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    )
  }

  return (
    <thead className="bg-gray-50">
      <tr className="[&>th]:border-r [&>th]:border-gray-200 [&>th]:last:border-r-0">
        {showCheckboxes && (
          <th className={`${headerBase} text-center w-8`}>
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={input => {
                if (input) input.indeterminate = isPartiallySelected
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-gray-700 focus:ring-gray-500 w-3 h-3"
            />
          </th>
        )}
        <th className={`${headerBase} text-center text-gray-600 w-16`}>
          image
        </th>
        <th
          className={`group ${headerBase} text-left ${sortableHeaderClass} transition-colors min-w-[120px] max-w-[200px]`}
          onClick={() => handleSort('name')}
        >
          <span className="flex items-center">
            name
            {!isEditable && renderSortIcon('name')}
          </span>
        </th>
        <th
          className={`group ${headerBase} text-center ${sortableHeaderClass} transition-colors w-20`}
          onClick={() => handleSort('category')}
        >
          <span className="flex items-center justify-center">
            category
            {!isEditable && renderSortIcon('category')}
          </span>
        </th>
        <th className={`${headerBase} text-right text-gray-600 w-12`}>
          qty
        </th>
        <th className={`${headerBase} text-center w-14`}>
          <button
            type="button"
            onClick={onQuantityDisplayModeChange}
            className="inline-flex items-center justify-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
            title={`Filter: ${getStatusFilterLabel()} (click to cycle)`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getStatusFilterColor() }}
            />
            <span className="text-[11px] tracking-[0.04em]">{getStatusFilterLabel()}</span>
          </button>
        </th>
        <th className={`${headerBase} text-center text-gray-600 w-16`}>
          class
        </th>
        <th
          className={`group ${headerBase} text-right ${sortableHeaderClass} transition-colors w-20`}
          onClick={() => handleSort('weight')}
        >
          <span className="flex items-center justify-center">
            g
            {!isEditable && renderSortIcon('weight')}
          </span>
        </th>
        <th
          className={`group ${headerBase} text-right ${sortableHeaderClass} transition-colors w-16`}
          onClick={() => handleSort('priority')}
        >
          <span className="flex items-center justify-center">
            priority
            {!isEditable && renderSortIcon('priority')}
          </span>
        </th>
        <th
          className={`group ${headerBase} text-right ${sortableHeaderClass} transition-colors w-16`}
          onClick={() => handleSort('price')}
        >
          <span className="inline-flex items-center justify-center">
            price
            {onCurrencyChange && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onCurrencyChange()
                }}
                className="ml-0.5 text-xs hover:text-gray-700"
                title="Toggle currency"
              >
                {currency === 'JPY' ? '¥' : '$'}
              </button>
            )}
            {!isEditable && renderSortIcon('price')}
          </span>
        </th>
        <th
          className={`group ${headerBase} text-right ${sortableHeaderClass} transition-colors w-16`}
          onClick={() => handleSort('season')}
        >
          <span className="flex items-center justify-center">
            season
            {!isEditable && renderSortIcon('season')}
          </span>
        </th>
        {showEditColumn && (
          <th className="px-2 py-2 text-center w-8"></th>
        )}
      </tr>
    </thead>
  )
}

export default TableHeader
