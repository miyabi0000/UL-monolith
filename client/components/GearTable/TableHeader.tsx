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
  showEditColumn = false
}) => {
  const getQuantityLabel = () => {
    switch (quantityDisplayMode) {
      case 'owned': return 'Own'
      case 'need': return 'Need'
      case 'all': return 'All'
      default: return 'Own'
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
          Image
        </th>
        <th
          className="group px-2 py-2 text-left font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[120px] max-w-[200px]"
          onClick={() => onSort('name')}
        >
          <span className="flex items-center">
            Name
            {renderSortIcon('name')}
          </span>
        </th>
        <th
          className="group px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-20"
          onClick={() => onSort('category')}
        >
          <span className="flex items-center justify-center">
            Cat
            {renderSortIcon('category')}
          </span>
        </th>
        <th className="px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 w-12">
          <button
            type="button"
            onClick={onQuantityDisplayModeChange}
            className="inline-flex items-center justify-center hover:text-gray-700 dark:hover:text-gray-300"
            title="Toggle quantity mode"
          >
            {getQuantityLabel()}
          </button>
        </th>
        <th className="px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 w-14">
          Status
        </th>
        <th className="px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 w-16">
          WtCls
        </th>
        <th
          className="group px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-20"
          onClick={() => onSort('weight')}
        >
          <span className="flex items-center justify-center">
            Wt(g)
            {renderSortIcon('weight')}
          </span>
        </th>
        <th
          className="group px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-12"
          onClick={() => onSort('priority')}
        >
          <span className="flex items-center justify-center">
            Pri
            {renderSortIcon('priority')}
          </span>
        </th>
        <th
          className="group px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-16"
          onClick={() => onSort('price')}
        >
          <span className="inline-flex items-center justify-center">
            Price
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
            {renderSortIcon('price')}
          </span>
        </th>
        <th
          className="group px-2 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-16"
          onClick={() => onSort('season')}
        >
          <span className="flex items-center justify-center">
            Ssn
            {renderSortIcon('season')}
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
