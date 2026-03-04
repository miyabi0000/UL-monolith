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
  isEditable?: boolean
}

type HeaderColumn = {
  key: string
  label: string
  widthClass: string
  align?: 'left' | 'center'
  sortable?: boolean
  sortField?: SortField
}

const COLUMNS: HeaderColumn[] = [
  { key: 'image', label: 'image', widthClass: 'w-20' },
  { key: 'name', label: 'name', widthClass: 'min-w-[112px] max-w-[188px]', sortable: true, sortField: 'name' },
  { key: 'category', label: 'category', widthClass: 'w-20', sortable: true, sortField: 'category' },
  { key: 'quantity', label: 'ALL', widthClass: 'w-[88px]', align: 'center' },
  { key: 'weight', label: 'g', widthClass: 'w-[72px]', align: 'center', sortable: true, sortField: 'weight' },
  { key: 'priority', label: 'priority', widthClass: 'w-8', align: 'center', sortable: true, sortField: 'priority' },
  { key: 'price', label: 'price', widthClass: 'w-14', align: 'center', sortable: true, sortField: 'price' },
  { key: 'season', label: 'season', widthClass: 'w-14', sortable: true, sortField: 'season' },
]

const toAriaSort = (isActive: boolean, direction: SortDirection): React.AriaAttributes['aria-sort'] =>
  isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'

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
  isEditable = false,
}) => {
  const thBase = 'gear-th px-1.5 py-1'
  const labelBase = 'inline-flex h-6 w-full items-center rounded px-1.5 text-[11px] leading-none font-medium'
  const inactiveText = 'text-gray-500 dark:text-gray-300'
  const hoverText = 'hover:text-gray-700 dark:hover:text-gray-100'

  const getStatusFilterLabel = () => {
    switch (quantityDisplayMode) {
      case 'owned':
        return 'Owned'
      case 'need':
        return 'Needed'
      case 'all':
      default:
        return 'ALL'
    }
  }

  const getStatusFilterColor = () => {
    switch (quantityDisplayMode) {
      case 'owned':
        return COLORS.success
      case 'need':
        return COLORS.error
      case 'all':
      default:
        return COLORS.gray[500]
    }
  }

  const renderSortGlyph = (field: SortField) => {
    const isActive = sortField === field
    const color = isActive
      ? 'text-gray-700 dark:text-gray-100'
      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'

    return (
      <span className={`inline-flex w-3 justify-center text-[10px] leading-none ${color}`}>
        {isActive ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    )
  }

  const renderStandardColumn = (column: HeaderColumn) => {
    if (!column.sortable || !column.sortField) {
      return (
        <th key={column.key} className={`${thBase} ${column.align === 'center' ? 'text-center' : 'text-left'} ${column.widthClass}`}>
          <span className={`${labelBase} ${column.align === 'center' ? 'justify-center' : 'justify-start'} ${inactiveText}`}>
            <span className="whitespace-nowrap">{column.label}</span>
          </span>
        </th>
      )
    }

    const isActive = sortField === column.sortField
    return (
      <th
        key={column.key}
        className={`${thBase} ${column.align === 'center' ? 'text-center' : 'text-left'} ${column.widthClass}`}
        aria-sort={toAriaSort(isActive, sortDirection)}
      >
        <button
          type="button"
          disabled={isEditable}
          onClick={() => onSort(column.sortField!)}
          className={`group ${labelBase} ${column.align === 'center' ? 'justify-between' : 'justify-between'} ${
            isEditable ? 'text-gray-400 dark:text-gray-500 cursor-default' : `${inactiveText} ${hoverText}`
          }`}
          aria-label={`Sort by ${column.label}`}
        >
          <span className="whitespace-nowrap">{column.label}</span>
          {renderSortGlyph(column.sortField)}
        </button>
      </th>
    )
  }

  return (
    <thead className="gear-table-head">
      <tr>
        {showCheckboxes && (
          <th className={`${thBase} text-center w-8`}>
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isPartiallySelected
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300 dark:border-slate-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 focus:ring-gray-500 dark:focus:ring-slate-400 w-3 h-3"
            />
          </th>
        )}

        {COLUMNS.map((column) => {
          if (column.key === 'quantity') {
            return (
              <th key={column.key} className={`${thBase} text-center ${column.widthClass}`}>
                <button
                  type="button"
                  onClick={onQuantityDisplayModeChange}
                  className={`${labelBase} justify-center gap-1.5 ${inactiveText} ${hoverText}`}
                  title={`Filter: ${getStatusFilterLabel()} (click to cycle)`}
                  aria-label="Cycle quantity filter mode"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusFilterColor() }} />
                  <span>{getStatusFilterLabel()}</span>
                </button>
              </th>
            )
          }

          if (column.key === 'price' && column.sortField) {
            const isActive = sortField === column.sortField
            return (
              <th
                key={column.key}
                className={`${thBase} text-center ${column.widthClass}`}
                aria-sort={toAriaSort(isActive, sortDirection)}
              >
                <div className="inline-flex h-6 w-full items-center gap-0.5">
                  <button
                    type="button"
                    disabled={isEditable}
                    onClick={() => onSort(column.sortField!)}
                    className={`group ${labelBase} min-w-0 flex-1 justify-between ${
                      isEditable ? 'text-gray-400 dark:text-gray-500 cursor-default' : `${inactiveText} ${hoverText}`
                    }`}
                    aria-label="Sort by price"
                  >
                    <span className="whitespace-nowrap">price</span>
                    {renderSortGlyph(column.sortField)}
                  </button>
                  {onCurrencyChange && (
                    <button
                      type="button"
                      onClick={onCurrencyChange}
                      className={`${labelBase} w-6 flex-shrink-0 justify-center px-0 ${inactiveText} ${hoverText}`}
                      title="Toggle currency"
                      aria-label="Toggle currency"
                    >
                      {currency === 'JPY' ? '¥' : '$'}
                    </button>
                  )}
                </div>
              </th>
            )
          }

          return renderStandardColumn(column)
        })}

        {showEditColumn && <th className="px-1.5 py-1 text-center w-8"></th>}
      </tr>
    </thead>
  )
}

export default TableHeader
