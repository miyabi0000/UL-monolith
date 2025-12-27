import React from 'react'
import BulkActionMenu from './BulkActionMenu'

type ViewMode = 'table' | 'card'

interface GearListHeaderProps {
  itemCount: number
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  showCheckboxes: boolean
  onToggleCheckboxes?: () => void
  onShowForm: () => void
}

const GearListHeader: React.FC<GearListHeaderProps> = ({
  itemCount,
  currentView,
  onViewChange,
  showCheckboxes,
  onToggleCheckboxes,
  onShowForm
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
            aria-label="カードビュー"
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
            aria-label="テーブルビュー"
          >
            Table
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onShowForm}
          className="btn-primary font-semibold text-xs px-2.5 py-1.5 rounded shadow-sm"
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
