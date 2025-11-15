import React, { useState, useRef, useEffect } from 'react'
import BulkActionMenu from './BulkActionMenu'

type ViewMode = 'table' | 'card'

interface GearListHeaderProps {
  itemCount: number
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  showCheckboxes: boolean
  onToggleCheckboxes?: () => void
  onShowForm: () => void
  onShowBulkUrlInput?: () => void
}

const GearListHeader: React.FC<GearListHeaderProps> = ({
  itemCount,
  currentView,
  onViewChange,
  showCheckboxes,
  onToggleCheckboxes,
  onShowForm,
  onShowBulkUrlInput
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false)
      }
    }

    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAddMenu])

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
        {/* ADD ドロップダウンメニュー */}
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="btn-primary font-semibold text-xs px-2.5 py-1.5 rounded shadow-sm flex items-center gap-1"
          >
            + ADD
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={() => {
                  onShowForm()
                  setShowAddMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md"
              >
                Add Single Gear
              </button>
              {onShowBulkUrlInput && (
                <button
                  onClick={() => {
                    onShowBulkUrlInput()
                    setShowAddMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-md border-t border-gray-200 dark:border-gray-700"
                >
                  Add from URLs
                </button>
              )}
            </div>
          )}
        </div>

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
