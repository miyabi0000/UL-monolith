import React from 'react'
import BulkActionMenu from './BulkActionMenu'
import { ViewMode } from '../utils/types'

type SortDirection = 'asc' | 'desc'

interface GearListHeaderProps {
  itemCount: number
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  showCheckboxes: boolean
  onToggleCheckboxes?: () => void
  onShowForm: () => void
  sortField?: string
  sortDirection?: SortDirection
  onSort?: (field: string) => void
}

const GearListHeader: React.FC<GearListHeaderProps> = ({
  itemCount,
  currentView,
  onViewChange,
  showCheckboxes,
  onToggleCheckboxes,
  onShowForm,
  sortField,
  sortDirection,
  onSort
}) => {
  return (
    <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          GEAR LIST
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {itemCount} items
        </span>

        {/* ViewSwitcher統合 */}
        <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800">
          <button
            onClick={() => onViewChange('card')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              currentView === 'card'
                ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            aria-label="Card view"
          >
            Card
          </button>
          <button
            onClick={() => onViewChange('table')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              currentView === 'table'
                ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            aria-label="Table view"
          >
            Table
          </button>
          <button
            onClick={() => onViewChange('compare')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              currentView === 'compare'
                ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            aria-label="Comparison view"
          >
            Compare
          </button>
        </div>

        {/* ソート機能 */}
        {onSort && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">Sort by:</span>
            <button
              onClick={() => onSort('name')}
              className={`px-2.5 py-1 text-xs rounded transition-colors border ${
                sortField === 'name'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'
              }`}
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => onSort('weight')}
              className={`px-2.5 py-1 text-xs rounded transition-colors border ${
                sortField === 'weight'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'
              }`}
            >
              Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => onSort('price')}
              className={`px-2.5 py-1 text-xs rounded transition-colors border ${
                sortField === 'price'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'
              }`}
            >
              Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onShowForm}
          className="btn-primary btn-xs"
        >
          + ADD
        </button>
        {onToggleCheckboxes && (
          <BulkActionMenu
            showCheckboxes={showCheckboxes}
            onToggleCheckboxes={onToggleCheckboxes}
          />
        )}
      </div>
    </div>
  )
}

export default GearListHeader
