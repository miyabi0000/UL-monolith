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
    ? 'text-gray-400 dark:text-gray-500 cursor-default'
    : 'text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-white/55 dark:hover:bg-slate-700/40'
  const headerBase = 'gear-th px-2 py-2'
  const getStatusFilterLabel = () => {
    switch (quantityDisplayMode) {
      case 'owned': return 'Owned'
      case 'need': return 'Needed'
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
    const isActive = sortField === field
    return (
      <span className={`gear-text-micro ml-1.5 ${isActive ? 'text-gray-700 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
        {isActive ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    )
  }

  const headerLabelClass = 'gear-glass-chip inline-flex items-center justify-start gap-1 rounded-md px-1.5 py-0.5 text-left'
  const headerLabelNumericClass = 'gear-glass-chip inline-flex items-center justify-center gap-1 rounded-md px-1.5 py-0.5 text-center w-full'

  return (
    <thead className="gear-table-head">
      <tr>
        {showCheckboxes && (
          <th className={`${headerBase} text-center w-8`}>
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={input => {
                if (input) input.indeterminate = isPartiallySelected
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300 dark:border-slate-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 focus:ring-gray-500 dark:focus:ring-slate-400 w-3 h-3"
            />
          </th>
        )}
        <th className={`${headerBase} text-left text-gray-600 dark:text-gray-300 w-16`}>
          <span className={headerLabelClass}>image</span>
        </th>
        <th
          className={`group ${headerBase} text-left ${sortableHeaderClass} transition-colors min-w-[120px] max-w-[200px]`}
          onClick={() => handleSort('name')}
        >
          <span className={headerLabelClass}>
            name
            {renderSortIcon('name')}
          </span>
        </th>
        <th
          className={`group ${headerBase} text-left ${sortableHeaderClass} transition-colors w-24`}
          onClick={() => handleSort('category')}
        >
          <span className={headerLabelClass}>
            category
            {renderSortIcon('category')}
          </span>
        </th>
        <th className={`${headerBase} text-center text-gray-600 dark:text-gray-300 w-[112px]`}>
          <div className="inline-flex items-center justify-center">
            <button
              type="button"
              onClick={onQuantityDisplayModeChange}
              className="gear-glass-chip inline-flex items-center justify-center gap-1 rounded-md px-1.5 py-0.5 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
              title={`Filter: ${getStatusFilterLabel()} (click to cycle)`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getStatusFilterColor() }}
              />
              <span className="gear-text-micro">{getStatusFilterLabel()}</span>
            </button>
          </div>
        </th>
        <th
          className={`group ${headerBase} text-center ${sortableHeaderClass} transition-colors w-20`}
          onClick={() => handleSort('weight')}
        >
          <span className={headerLabelNumericClass}>
            g
            {renderSortIcon('weight')}
          </span>
        </th>
        <th
          className={`group ${headerBase} text-center ${sortableHeaderClass} transition-colors w-10`}
          onClick={() => handleSort('priority')}
        >
          <span className={headerLabelNumericClass}>
            priority
            {renderSortIcon('priority')}
          </span>
        </th>
        <th
          className={`group ${headerBase} text-center ${sortableHeaderClass} transition-colors w-16`}
          onClick={() => handleSort('price')}
        >
          <span className={headerLabelNumericClass}>
            price
            {onCurrencyChange && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onCurrencyChange()
                }}
                className="gear-text-micro hover:text-gray-700 dark:hover:text-gray-100"
                title="Toggle currency"
              >
                {currency === 'JPY' ? '¥' : '$'}
              </button>
            )}
            {renderSortIcon('price')}
          </span>
        </th>
        <th
          className={`group ${headerBase} text-left ${sortableHeaderClass} transition-colors w-16`}
          onClick={() => handleSort('season')}
        >
          <span className={headerLabelClass}>
            season
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
