import React from 'react'
import type { QuantityDisplayMode } from '../../utils/types'

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
    ? 'text-gray-400 dark:text-gray-500 cursor-default'
    : 'text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
  const getStatusFilterLabel = () => {
    switch (quantityDisplayMode) {
      case 'owned': return 'own'
      case 'need': return 'need'
      case 'all': return 'all'
      default: return 'all'
    }
  }
  const getStatusFilterColor = () => {
    switch (quantityDisplayMode) {
      case 'owned': return '#10B981'
      case 'need': return '#EF4444'
      case 'all': return '#6B7280'
      default: return '#6B7280'
    }
  }
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return (
      <span className="ml-1 text-[10px] text-gray-600 dark:text-gray-400">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <thead className="bg-gray-50 dark:bg-gray-900">
      <tr>
        {showCheckboxes && (
          <th className="px-2 py-2 text-center w-8">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={input => {
                if (input) input.indeterminate = isPartiallySelected
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600 text-blue-600 focus:ring-blue-500 w-3 h-3"
            />
          </th>
        )}
        <th className="px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 w-16">
          image
        </th>
        <th
          className={`group px-2 py-2 text-left font-medium text-xs ${sortableHeaderClass} transition-colors min-w-[120px] max-w-[200px]`}
          onClick={() => handleSort('name')}
        >
          <span className="flex items-center">
            name
            {!isEditable && renderSortIcon('name')}
          </span>
        </th>
        <th
          className={`group px-2 py-2 text-center font-medium text-xs ${sortableHeaderClass} transition-colors w-20`}
          onClick={() => handleSort('category')}
        >
          <span className="flex items-center justify-center">
            category
            {!isEditable && renderSortIcon('category')}
          </span>
        </th>
        <th className="px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 w-12">
          qty
        </th>
        <th className="px-2 py-2 text-center font-medium text-xs w-14">
          <button
            type="button"
            onClick={onQuantityDisplayModeChange}
            className="inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title={`Filter: ${getStatusFilterLabel()} (click to cycle)`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getStatusFilterColor() }}
            />
            <span className="text-xs">{getStatusFilterLabel()}</span>
          </button>
        </th>
        <th className="px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 w-16">
          class
        </th>
        <th
          className={`group px-2 py-2 text-center font-medium text-xs ${sortableHeaderClass} transition-colors w-20`}
          onClick={() => handleSort('weight')}
        >
          <span className="flex items-center justify-center">
            g
            {!isEditable && renderSortIcon('weight')}
          </span>
        </th>
        <th
          className={`group px-2 py-2 text-center font-medium text-xs ${sortableHeaderClass} transition-colors w-16`}
          onClick={() => handleSort('priority')}
        >
          <span className="flex items-center justify-center">
            priority
            {!isEditable && renderSortIcon('priority')}
          </span>
        </th>
        <th
          className={`group px-2 py-2 text-center font-medium text-xs ${sortableHeaderClass} transition-colors w-16`}
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
                className="ml-0.5 text-xs hover:text-gray-700 dark:hover:text-gray-300"
                title="Toggle currency"
              >
                {currency === 'JPY' ? '¥' : '$'}
              </button>
            )}
            {!isEditable && renderSortIcon('price')}
          </span>
        </th>
        <th
          className={`group px-2 py-2 text-center font-medium text-xs ${sortableHeaderClass} transition-colors w-16`}
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
