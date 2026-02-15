import React from 'react'
import { GearItemWithCalculated } from '../../utils/types'

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
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="p-0.5 rounded-full transition-colors text-xs hover:bg-gray-100 text-gray-400"
      >
        ⋮
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={onClose}
          />
          <div className="absolute right-0 mt-1 shadow-lg min-w-[100px] bg-white border border-gray-200 rounded-md py-1 z-[9999]">
            <button
              onClick={() => {
                onEdit(item)
                onClose()
              }}
              className="w-full text-left text-xs transition-colors block px-3 py-2 hover:bg-gray-100 text-gray-700"
            >
              Edit
            </button>
            {onDuplicate && (
              <button
                onClick={() => {
                  onDuplicate(item)
                  onClose()
                }}
                className="w-full text-left text-xs transition-colors block px-3 py-2 hover:bg-gray-100 text-gray-700"
              >
                Duplicate
              </button>
            )}
            <hr className="border-gray-200 my-1" />
            <button
              onClick={() => {
                onDelete([item.id])
                onClose()
              }}
              className="w-full text-left text-xs transition-colors block px-3 py-2 hover:bg-red-50 text-red-600"
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
