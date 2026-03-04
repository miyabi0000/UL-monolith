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

interface HeaderChipProps {
  align?: 'left' | 'center'
  className?: string
  as?: 'span' | 'button'
  onClick?: () => void
  title?: string
  children: React.ReactNode
}

const HeaderChip: React.FC<HeaderChipProps> = ({
  align = 'left',
  className = '',
  as = 'span',
  onClick,
  title,
  children,
}) => {
  const baseClass = [
    'gear-glass-chip inline-flex items-center gap-1 rounded-md px-1.5',
    'h-6 w-full text-[11px] leading-none',
    align === 'center' ? 'justify-center text-center' : 'justify-start text-left',
    className,
  ].join(' ')

  if (as === 'button') {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`${baseClass} text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition-colors`}
      >
        {children}
      </button>
    )
  }

  return <span className={baseClass}>{children}</span>
}

interface HeaderCellProps {
  widthClass: string
  align?: 'left' | 'center'
  sortable?: boolean
  isEditable: boolean
  sortField?: SortField
  onSort?: (field: SortField) => void
  children: React.ReactNode
}

const HeaderCell: React.FC<HeaderCellProps> = ({
  widthClass,
  align = 'left',
  sortable = false,
  isEditable,
  sortField,
  onSort,
  children,
}) => {
  const headerBase = 'gear-th px-2 py-2'
  const sortableHeaderClass = isEditable
    ? 'text-gray-400 dark:text-gray-500 cursor-default'
    : 'text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-white/55 dark:hover:bg-slate-700/40'

  const className = sortable
    ? `group ${headerBase} ${align === 'center' ? 'text-center' : 'text-left'} ${sortableHeaderClass} transition-colors ${widthClass}`
    : `${headerBase} ${align === 'center' ? 'text-center' : 'text-left'} text-gray-600 dark:text-gray-300 ${widthClass}`

  return (
    <th className={className} onClick={sortable && sortField && onSort ? () => onSort(sortField) : undefined}>
      {children}
    </th>
  )
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
  const handleSort = (field: SortField) => {
    if (isEditable) return
    onSort(field)
  }

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
        <HeaderCell widthClass="w-20" isEditable={isEditable}>
          <HeaderChip>image</HeaderChip>
        </HeaderCell>
        <HeaderCell widthClass="min-w-[112px] max-w-[188px]" sortable isEditable={isEditable} sortField="name" onSort={handleSort}>
          <HeaderChip>
            name
            {renderSortIcon('name')}
          </HeaderChip>
        </HeaderCell>
        <HeaderCell widthClass="w-20" sortable isEditable={isEditable} sortField="category" onSort={handleSort}>
          <HeaderChip>
            category
            {renderSortIcon('category')}
          </HeaderChip>
        </HeaderCell>
        <HeaderCell widthClass="w-[88px]" align="center" isEditable={isEditable}>
          <div className="inline-flex items-center justify-center">
            <HeaderChip
              as="button"
              align="center"
              onClick={onQuantityDisplayModeChange}
              title={`Filter: ${getStatusFilterLabel()} (click to cycle)`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getStatusFilterColor() }}
              />
              <span className="gear-text-micro">{getStatusFilterLabel()}</span>
            </HeaderChip>
          </div>
        </HeaderCell>
        <HeaderCell widthClass="w-[72px]" align="center" sortable isEditable={isEditable} sortField="weight" onSort={handleSort}>
          <HeaderChip align="center">
            g
            {renderSortIcon('weight')}
          </HeaderChip>
        </HeaderCell>
        <HeaderCell widthClass="w-8" align="center" sortable isEditable={isEditable} sortField="priority" onSort={handleSort}>
          <HeaderChip align="center">
            priority
            {renderSortIcon('priority')}
          </HeaderChip>
        </HeaderCell>
        <HeaderCell widthClass="w-14" align="center" sortable isEditable={isEditable} sortField="price" onSort={handleSort}>
          <HeaderChip align="center">
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
          </HeaderChip>
        </HeaderCell>
        <HeaderCell widthClass="w-14" sortable isEditable={isEditable} sortField="season" onSort={handleSort}>
          <HeaderChip>
            season
            {renderSortIcon('season')}
          </HeaderChip>
        </HeaderCell>
        {showEditColumn && (
          <th className="px-2 py-2 text-center w-8"></th>
        )}
      </tr>
    </thead>
  )
}

export default TableHeader
