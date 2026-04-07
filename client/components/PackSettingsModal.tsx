import React, { useEffect, useState } from 'react'
import type { Pack } from '../utils/types'

interface PackSettingsModalProps {
  pack: Pack
  onSave: (updates: { name: string; routeName?: string; description?: string }) => void
  onDelete: () => void
  onCopyLink: () => void
  onOpen: () => void
  onClose: () => void
}

const PackSettingsModal: React.FC<PackSettingsModalProps> = ({
  pack,
  onSave,
  onDelete,
  onCopyLink,
  onOpen,
  onClose,
}) => {
  const [name, setName] = useState(pack.name)
  const [routeName, setRouteName] = useState(pack.routeName || '')
  const [description, setDescription] = useState(pack.description || '')

  const hasChanges =
    name.trim() !== pack.name ||
    routeName.trim() !== (pack.routeName || '') ||
    description.trim() !== (pack.description || '')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSave = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave({
      name: trimmedName,
      routeName: routeName.trim() || undefined,
      description: description.trim() || undefined,
    })
    onClose()
  }

  const handleDelete = () => {
    if (!window.confirm(`「${pack.name}」を削除しますか？`)) return
    onDelete()
    onClose()
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-panel-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 neu-divider">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Pack Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 grid gap-4">
          <div>
            <label className="gear-text-micro block mb-1.5">Pack Name</label>
            <input
              className="input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pack name"
              autoFocus
            />
          </div>
          <div>
            <label className="gear-text-micro block mb-1.5">Route</label>
            <input
              className="input w-full"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="例: 高尾山 6.2km loop"
            />
          </div>
          <div>
            <label className="gear-text-micro block mb-1.5">Description</label>
            <textarea
              className="input w-full min-h-[80px] text-xs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="パックの説明"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={onOpen}>
              Open
            </button>
            <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={onCopyLink}>
              Copy Link
            </button>
            <button
              type="button"
              className="h-8 px-3 rounded-md text-xs text-red-600 dark:text-red-400 neu-raised hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary h-8 px-3 text-xs"
              onClick={handleSave}
              disabled={!hasChanges || !name.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PackSettingsModal
