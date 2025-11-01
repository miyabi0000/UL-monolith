import React from 'react'

export type SortField = 'name' | 'category' | 'weight' | 'shortage' | 'priority' | 'price' | 'owned' | 'required' | 'season'
export type SortDirection = 'asc' | 'desc'

interface TableHeaderProps {
  showCheckboxes: boolean
  isAllSelected: boolean
  isPartiallySelected: boolean
  sortField: SortField
  sortDirection: SortDirection
  quantityDisplayMode: 'owned' | 'required' | 'shortage'
  onSelectAll: (checked: boolean) => void
  onSort: (field: SortField) => void
  onQuantityDisplayModeChange: () => void
}

const TableHeader: React.FC<TableHeaderProps> = ({
  showCheckboxes,
  isAllSelected,
  isPartiallySelected,
  sortField,
  sortDirection,
  quantityDisplayMode,
  onSelectAll,
  onSort,
  onQuantityDisplayModeChange
}) => {
  const getQuantityLabel = () => {
    switch (quantityDisplayMode) {
      case 'owned': return 'Own'
      case 'required': return 'Need'
      case 'shortage': return 'Short'
      default: return 'Own'
    }
  }
  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return (
        <span className="text-blue-500 dark:text-blue-400 ml-1">
          {sortDirection === 'asc' ? '↑' : '↓'}
        </span>
      )
    }
    return (
      <span className="text-gray-300 dark:text-gray-600 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
        ↕
      </span>
    )
  }

  return (
    <thead className="bg-gray-50 dark:bg-gray-900">
      <tr>
        {showCheckboxes && (
          <th className="px-3 py-2 text-center">
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
        <th className="px-3 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400">
          Image
        </th>
        <th
          className="group px-3 py-2 text-left font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => onSort('name')}
        >
          <span className="flex items-center">
            Name
            {renderSortIcon('name')}
          </span>
        </th>
        <th
          className="group px-3 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => onSort('category')}
        >
          <span className="flex items-center justify-center">
            Category
            {renderSortIcon('category')}
          </span>
        </th>
        <th
          className="group px-3 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={onQuantityDisplayModeChange}
        >
          <span className="flex items-center justify-center">
            {getQuantityLabel()}
            <span className="text-gray-300 dark:text-gray-600 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
              ⇄
            </span>
          </span>
        </th>
        <th
          className="group px-3 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => onSort('weight')}
        >
          <span className="flex items-center justify-center">
            Weight
            {renderSortIcon('weight')}
          </span>
        </th>
        <th
          className="group px-3 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => onSort('priority')}
        >
          <span className="flex items-center justify-center">
            Priority
            {renderSortIcon('priority')}
          </span>
        </th>
        <th
          className="group px-3 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => onSort('price')}
        >
          <span className="flex items-center justify-center">
            Price
            {renderSortIcon('price')}
          </span>
        </th>
        <th
          className="group px-3 py-2 text-center font-medium text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => onSort('season')}
        >
          <span className="flex items-center justify-center">
            Season
            {renderSortIcon('season')}
          </span>
        </th>
      </tr>
    </thead>
  )
}

export default TableHeader

