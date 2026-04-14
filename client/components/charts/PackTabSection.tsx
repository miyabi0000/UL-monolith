import React, { useEffect, useRef, useState } from 'react'

interface PackTabSectionProps {
  packList: Array<{ id: string; name: string }>
  selectedPackId: string | null | undefined
  onSelectPack?: (packId: string | null) => void
  onCreatePack?: (name: string) => void
  onOpenPackSettings?: () => void
  /** タブ切替時に Chart の選択/カテゴリをクリアする副作用 */
  onPackChange?: () => void
}

/**
 * Pack タブ + New Pack 入力フォーム
 *
 * GearDetailPanel のヘッダー左部に配置される Pack 切替 UI。
 * ALL / 各 Pack タブ + 歯車ボタン + "+" New Pack ボタンで構成。
 */
const PackTabSection: React.FC<PackTabSectionProps> = ({
  packList,
  selectedPackId,
  onSelectPack,
  onCreatePack,
  onOpenPackSettings,
  onPackChange,
}) => {
  const [showNewPackInput, setShowNewPackInput] = useState(false)
  const [newPackName, setNewPackName] = useState('')
  const newPackInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showNewPackInput) newPackInputRef.current?.focus()
  }, [showNewPackInput])

  const handleSwitchPack = (packId: string | null) => {
    onSelectPack?.(packId)
    onPackChange?.()
  }

  const handleCreateNewPack = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newPackName.trim()
    if (!trimmed || !onCreatePack) return
    onCreatePack(trimmed)
    setNewPackName('')
    setShowNewPackInput(false)
  }

  return (
    <>
      {/* ALL タブ */}
      <button
        type="button"
        onClick={() => handleSwitchPack(null)}
        className={[
          'flex-shrink-0 h-7 px-2.5 rounded-lg font-medium transition-colors',
          !selectedPackId
            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
        ].join(' ')}
      >
        ALL
      </button>

      {/* Pack タブ */}
      {packList.map((pack) => {
        const isActive = pack.id === selectedPackId
        return (
          <div key={pack.id} className="flex items-center flex-shrink-0">
            <button
              type="button"
              onClick={() => handleSwitchPack(pack.id)}
              className={[
                'h-7 font-medium transition-colors',
                isActive && onOpenPackSettings ? 'pl-2.5 pr-1.5 rounded-l-lg' : 'pl-2.5 pr-2.5 rounded-lg',
                isActive
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
              ].join(' ')}
            >
              {pack.name}
            </button>
            {isActive && onOpenPackSettings && (
              <button
                type="button"
                onClick={onOpenPackSettings}
                className="h-7 w-6 flex items-center justify-center rounded-r-lg bg-white dark:bg-slate-700 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 shadow-sm transition-colors border-l border-gray-100 dark:border-slate-600"
                title="Pack settings"
                aria-label="Pack settings"
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        )
      })}

      {/* + New Pack */}
      {showNewPackInput ? (
        <form onSubmit={handleCreateNewPack} className="flex items-center gap-1 flex-shrink-0">
          <input
            ref={newPackInputRef}
            className="h-7 rounded-lg border-0 bg-white dark:bg-slate-700 px-2 text-xs font-medium text-gray-900 dark:text-gray-100 shadow-sm focus:ring-1 focus:ring-gray-400 dark:focus:ring-slate-500 w-28"
            placeholder="Pack name"
            value={newPackName}
            onChange={(e) => setNewPackName(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary h-7 px-2 text-xs">OK</button>
          <button
            type="button"
            className="btn-secondary h-7 px-2 text-xs"
            onClick={() => { setShowNewPackInput(false); setNewPackName('') }}
          >✕</button>
        </form>
      ) : (
        <button
          type="button"
          className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          onClick={() => setShowNewPackInput(true)}
          title="New pack"
          aria-label="New pack"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </>
  )
}

export default PackTabSection
