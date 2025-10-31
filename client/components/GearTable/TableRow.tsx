import React from 'react'
import { GearItemWithCalculated, Category } from '../../utils/types'
import { getPriorityColor } from '../../utils/designSystem'
import { formatPrice } from '../../utils/formatters'
import SeasonBar from '../SeasonBar'

interface TableRowProps {
  item: GearItemWithCalculated
  categories: Category[]
  showCheckboxes: boolean
  isSelected: boolean
  changedFields?: Set<string>
  onSelectItem: (id: string, checked: boolean) => void
  onUpdateItem: (id: string, field: string, value: any) => void
}

const TableRow: React.FC<TableRowProps> = ({
  item,
  categories,
  showCheckboxes,
  isSelected,
  changedFields,
  onSelectItem,
  onUpdateItem
}) => {
  const isFieldChanged = (field: string) => changedFields?.has(field) || false
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
        {showCheckboxes ? (
          <input
            type="url"
            value={item.imageUrl || ''}
            onChange={(e) => onUpdateItem(item.id, 'imageUrl', e.target.value || null)}
            placeholder="Image URL"
            className={`w-20 text-xs px-1 py-1 rounded border ${
              isFieldChanged('imageUrl')
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        ) : item.imageUrl ? (
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
          {showCheckboxes ? (
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdateItem(item.id, 'name', e.target.value)}
              className={`w-full text-sm px-2 py-1 rounded border ${
                isFieldChanged('name')
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          ) : (
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
          )}
          {showCheckboxes ? (
            <input
              type="text"
              value={item.brand || ''}
              onChange={(e) => onUpdateItem(item.id, 'brand', e.target.value || null)}
              placeholder="Brand"
              className={`w-full text-xs px-2 py-1 mt-1 rounded border ${
                isFieldChanged('brand')
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          ) : item.brand ? (
            <div className="text-xs break-words text-gray-500 dark:text-gray-400">
              {item.brand}
            </div>
          ) : null}
        </div>
      </td>

      {/* Category */}
      <td className="px-2 py-1 whitespace-nowrap text-center">
        {showCheckboxes ? (
          <select
            value={item.categoryId || ''}
            onChange={(e) => onUpdateItem(item.id, 'categoryId', e.target.value)}
            className={`text-xs px-2 py-1 rounded-md border ${
              isFieldChanged('categoryId')
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">No Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.path.join(' > ')}
              </option>
            ))}
          </select>
        ) : (
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
        )}
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
        {showCheckboxes ? (
          <input
            type="number"
            min="0"
            value={item.weightGrams || ''}
            onChange={(e) => onUpdateItem(item.id, 'weightGrams', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="0"
            className={`w-16 text-xs px-1 py-1 rounded border ${
              isFieldChanged('weightGrams')
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        ) : (
          <>
            {item.weightGrams ? `${item.totalWeight}g` : '-'}
            {item.weightGrams && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ({item.weightGrams}g × {item.requiredQuantity})
              </div>
            )}
          </>
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
        {showCheckboxes ? (
          <input
            type="number"
            min="0"
            value={item.priceCents || ''}
            onChange={(e) => onUpdateItem(item.id, 'priceCents', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="0"
            className={`w-20 text-xs px-1 py-1 rounded border ${
              isFieldChanged('priceCents')
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        ) : (
          formatPrice(item.priceCents)
        )}
      </td>

      {/* Season - 常に読み取り専用 */}
      <td className="px-2 py-1 text-center">
        <div className="flex justify-center">
          <SeasonBar
            seasons={item.seasons || []}
            isEditing={false}
            size="sm"
          />
        </div>
      </td>
    </tr>
  )
}

export default TableRow
