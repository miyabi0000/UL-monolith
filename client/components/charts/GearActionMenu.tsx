import React, { useEffect, useRef, useState } from 'react'

interface GearActionMenuProps {
  onShowForm?: () => void
  onShowUrlImport?: () => void
  onShowCategoryManager?: () => void
}

/**
 * 右上のアクションメニュー (+ボタン → ドロップダウン)。
 *
 * 責務:
 * - ADD Manually / ADD from URL / Manage Categories のトリガー
 * - メニュー外クリックで自動クローズ
 * - state と listener は内部に閉じる
 */
const GearActionMenu: React.FC<GearActionMenuProps> = ({
  onShowForm,
  onShowUrlImport,
  onShowCategoryManager,
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  if (!onShowForm) return null

  const itemClass =
    'w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2'

  return (
    <div ref={containerRef} className="relative add-menu-container z-[200] isolate">
      <button
        onClick={() => setOpen((p) => !p)}
        className="icon-btn"
        aria-label="Actions menu"
        title="Actions"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-sm py-1 z-[1000]">
          <button
            className={itemClass}
            onClick={() => { onShowForm(); setOpen(false) }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Manually
          </button>
          {onShowUrlImport && (
            <button
              className={itemClass}
              onClick={() => { onShowUrlImport(); setOpen(false) }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Add from URL
            </button>
          )}
          {onShowCategoryManager && (
            <>
              <div className="my-1 border-b border-gray-200" />
              <button
                className={itemClass}
                onClick={() => { onShowCategoryManager(); setOpen(false) }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Manage Categories
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default GearActionMenu
