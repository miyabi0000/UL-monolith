import React from 'react'

export type SortField = 'name' | 'category' | 'weight' | 'shortage' | 'priority' | 'price'
export type SortDirection = 'asc' | 'desc'

interface TableHeaderProps {
  showCheckboxes: boolean
  isAllSelected: boolean
  isPartiallySelected: boolean
  sortField: SortField
  sortDirection: SortDirection
  onSelectAll: (checked: boolean) => void
  onSort: (field: SortField) => void
}

const TableHeader: React.FC<TableHeaderProps> = ({
  showCheckboxes,
  isAllSelected,
  isPartiallySelected,
  sortField,
  sortDirection,
  onSelectAll,
  onSort
}) => {
  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? ' ↑' : ' ↓'
    }
    return ''
  }

  return (
    <thead className="bg-gray-50 dark:bg-gray-900">
      <tr>
        {showCheckboxes && (
          <th className="px-4 py-3 text-center">
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
        <th className="px-4 py-3 text-center font-medium text-sm text-gray-500 dark:text-gray-400">
          Image
        </th>
        <th
          className="px-4 py-3 text-left font-medium text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:opacity-70"
          onClick={() => onSort('name')}
        >
          Name{renderSortIcon('name')}
        </th>
        <th
          className="px-4 py-3 text-center font-medium text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:opacity-70"
          onClick={() => onSort('category')}
        >
          Category{renderSortIcon('category')}
        </th>
        <th className="px-4 py-3 text-center font-medium text-sm text-gray-500 dark:text-gray-400">
          Own/Need
        </th>
        <th
          className="px-4 py-3 text-center font-medium text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:opacity-70"
          onClick={() => onSort('weight')}
        >
          Weight{renderSortIcon('weight')}
        </th>
        <th
          className="px-4 py-3 text-center font-medium text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:opacity-70"
          onClick={() => onSort('priority')}
        >
          Priority{renderSortIcon('priority')}
        </th>
        <th
          className="px-4 py-3 text-center font-medium text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:opacity-70"
          onClick={() => onSort('price')}
        >
          Price{renderSortIcon('price')}
        </th>
        <th className="px-4 py-3 text-center font-medium text-sm text-gray-500 dark:text-gray-400">
          Actions
        </th>
      </tr>
    </thead>
  )
}

export default TableHeader

