import React from 'react'
import BulkActionMenu from './BulkActionMenu'
import { ViewMode } from '../utils/types'
import CardIcon from './icons/CardIcon'
import TableIcon from './icons/TableIcon'
import CompareIcon from './icons/CompareIcon'

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
    <div className="relative z-20 flex items-center justify-between px-3 py-2 neu-divider h-11">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-sm text-gray-900 tracking-tight">
          GEAR LIST
        </h3>
        <span className="text-xs text-gray-500 tabular-nums">
          {itemCount} items
        </span>

        {/* ソート機能 */}
        {onSort && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Sort by:</span>
            <button
              onClick={() => onSort('name')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                sortField === 'name'
                  ? 'bg-gray-100 text-gray-700 neu-raised'
                  : 'bg-transparent text-gray-500'
              }`}
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => onSort('weight')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                sortField === 'weight'
                  ? 'bg-gray-100 text-gray-700 neu-raised'
                  : 'bg-transparent text-gray-500'
              }`}
            >
              Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => onSort('price')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                sortField === 'price'
                  ? 'bg-gray-100 text-gray-700 neu-raised'
                  : 'bg-transparent text-gray-500'
              }`}
            >
              Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        )}
      </div>

      <div className="gear-glass-chip inline-flex items-center gap-1 rounded-md px-1 py-1">
        <div className="inline-flex rounded-md p-0.5 bg-white/50 neu-inset">
          <button
            onClick={() => onViewChange('card')}
            className={`w-7 h-7 rounded inline-flex items-center justify-center transition-all duration-200 ${
              currentView === 'card' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500'
            }`}
            aria-label="Card view"
            title="Card"
          >
            <CardIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewChange('table')}
            className={`w-7 h-7 rounded inline-flex items-center justify-center transition-all duration-200 ${
              currentView === 'table' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500'
            }`}
            aria-label="Table view"
            title="Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewChange('compare')}
            className={`w-7 h-7 rounded inline-flex items-center justify-center transition-all duration-200 ${
              currentView === 'compare' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500'
            }`}
            aria-label="Comparison view"
            title="Compare"
          >
            <CompareIcon className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onShowForm}
          className="icon-btn"
          aria-label="Add item"
          title="Add"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
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
