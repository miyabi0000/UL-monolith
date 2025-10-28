import React from 'react'
import { GearItemWithCalculated } from '../../utils/types'
import { getPriorityColor } from '../../utils/designSystem'
import { formatPrice } from '../../utils/formatters'
import ActionMenu from './ActionMenu'

interface TableRowProps {
  item: GearItemWithCalculated
  showCheckboxes: boolean
  isSelected: boolean
  openDropdown: string | null
  onSelectItem: (id: string, checked: boolean) => void
  onUpdateItem: (id: string, field: string, value: any) => void
  onEdit: (item: GearItemWithCalculated) => void
  onSave: (item: GearItemWithCalculated) => void
  onDelete: (ids: string[]) => void
  onToggleDropdown: (id: string | null) => void
}

const TableRow: React.FC<TableRowProps> = ({
  item,
  showCheckboxes,
  isSelected,
  openDropdown,
  onSelectItem,
  onUpdateItem,
  onEdit,
  onSave,
  onDelete,
  onToggleDropdown
}) => {
  return (
    <tr 
      className={`transition-colors hover:opacity-90 ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
      }`}
    >
      {/* Checkbox */}
      {showCheckboxes && (
        <td className="px-2 py-1 whitespace-nowrap text-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectItem(item.id, e.target.checked)}
            className="rounded w-3 h-3 accent-blue-600 dark:accent-blue-500"
          />
        </td>
      )}

      {/* Image */}
      <td className="px-2 py-1 text-center" style={{ height: '64px' }}>
        {item.imageUrl ? (
          <div className="flex items-center justify-center h-[56px]">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="max-w-[80px] max-h-[56px] w-auto h-auto object-contain rounded-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[56px]">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              -
            </span>
          </div>
        )}
      </td>

      {/* Name & Brand */}
      <td className="px-2 py-1">
        <div className="text-left">
          <div className="text-sm font-medium break-words text-gray-900 dark:text-gray-100">
            {item.productUrl ? (
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline transition-colors text-gray-700 dark:text-gray-300"
              >
                {item.name}
              </a>
            ) : (
              item.name
            )}
          </div>
          {item.brand && (
            <div className="text-xs break-words text-gray-500 dark:text-gray-400">
              {item.brand}
            </div>
          )}
        </div>
      </td>

      {/* Category */}
      <td className="px-2 py-1 whitespace-nowrap text-center">
        <span
          className="text-xs px-2 py-1 rounded-full font-medium inline-block"
          style={{
            backgroundColor: `${item.category?.color || '#9CA3AF'}20`,
            color: item.category?.color || '#9CA3AF',
            border: `1px solid ${item.category?.color || '#9CA3AF'}40`
          }}
        >
          {item.category?.name || 'Other'}
        </span>
      </td>

      {/* Own/Need */}
      <td className="px-2 py-1 whitespace-nowrap text-xs text-center text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-center space-x-1">
          <select
            value={item.ownedQuantity}
            onChange={(e) => onUpdateItem(item.id, 'ownedQuantity', parseInt(e.target.value))}
            className="w-8 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer text-center"
          >
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <span className="text-gray-400 dark:text-gray-500">/</span>
          <select
            value={item.requiredQuantity}
            onChange={(e) => onUpdateItem(item.id, 'requiredQuantity', parseInt(e.target.value))}
            className="w-8 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer text-center"
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
      </td>

      {/* Weight */}
      <td className="px-2 py-1 whitespace-nowrap text-xs text-center text-gray-900 dark:text-gray-100">
        {item.weightGrams ? `${item.totalWeight}g` : '-'}
        {item.weightGrams && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ({item.weightGrams}g × {item.requiredQuantity})
          </div>
        )}
      </td>

      {/* Priority */}
      <td className="px-2 py-1 whitespace-nowrap text-center">
        <div className="flex items-center justify-center space-x-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getPriorityColor(item.priority) }}
          />
          <select
            value={item.priority}
            onChange={(e) => onUpdateItem(item.id, 'priority', parseInt(e.target.value))}
            className="text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>
      </td>

      {/* Price */}
      <td className="px-2 py-1 whitespace-nowrap text-xs text-center text-gray-900 dark:text-gray-100">
        {formatPrice(item.priceCents)}
      </td>

      {/* Actions */}
      <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-center relative">
        <ActionMenu
          item={item}
          isOpen={openDropdown === item.id}
          onToggle={() => onToggleDropdown(openDropdown === item.id ? null : item.id)}
          onClose={() => onToggleDropdown(null)}
          onEdit={onEdit}
          onSave={onSave}
          onDelete={onDelete}
        />
      </td>
    </tr>
  )
}

export default TableRow

