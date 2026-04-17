import React, { useEffect, useRef, useState } from 'react'

interface GearManageMenuProps {
  onShowCategoryManager?: () => void
}

/**
 * 右上の管理メニュー（... ボタン → ドロップダウン）。
 *
 * 責務:
 * - Manage Categories のトリガー（将来的に他の管理系アクションを追加可能）
 * - メニュー外クリックで自動クローズ
 * - state と listener は内部に閉じる
 *
 * 旧 GearActionMenu にあった "Add Manually" / "Add from URL" は
 * Chat 中心 UX（ChatSidebar）への集約に伴い撤去された。新規ギア追加は
 * AppDock / ProfileHeader の Chat ボタンから開く ChatSidebar 経由で行う。
 */
const GearManageMenu: React.FC<GearManageMenuProps> = ({
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

  if (!onShowCategoryManager) return null

  const itemClass =
    'w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2'

  return (
    <div ref={containerRef} className="relative manage-menu-container z-[200] isolate">
      <button
        onClick={() => setOpen((p) => !p)}
        className="icon-btn"
        aria-label="Manage"
        title="Manage"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-sm py-1 z-[1000]">
          <button
            className={itemClass}
            onClick={() => { onShowCategoryManager(); setOpen(false) }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Manage Categories
          </button>
        </div>
      )}
    </div>
  )
}

export default GearManageMenu
