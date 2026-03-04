import React from 'react'
import { GearItemWithCalculated } from '../../utils/types'
import { STATUS_TONES } from '../../utils/designSystem'

interface ActionMenuProps {
  item: GearItemWithCalculated
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onEdit: (item: GearItemWithCalculated) => void
  onSave: (item: GearItemWithCalculated) => void
  onDelete: (ids: string[]) => void
  onDuplicate?: (item: GearItemWithCalculated) => void
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  item,
  isOpen,
  onToggle,
  onClose,
  onEdit,
  onSave,
  onDelete,
  onDuplicate
}) => {
  const errorTone = STATUS_TONES.error

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="p-0.5 rounded-full transition-colors text-xs hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500"
      >
        ⋮
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={onClose}
          />
          <div className="absolute right-0 mt-1 shadow-lg min-w-[100px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-md py-1 z-[9999]">
            <button
              onClick={() => {
                onEdit(item)
                onClose()
              }}
              className="w-full text-left text-xs transition-colors block px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-100"
            >
              Edit
            </button>
            {onDuplicate && (
              <button
                onClick={() => {
                  onDuplicate(item)
                  onClose()
                }}
                className="w-full text-left text-xs transition-colors block px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-100"
              >
                Duplicate
              </button>
            )}
            <hr className="border-gray-200 dark:border-slate-600 my-1" />
            <button
              onClick={() => {
                onDelete([item.id])
                onClose()
              }}
              className="w-full text-left text-xs transition-colors block px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700"
              style={{ color: errorTone.text }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ActionMenu
