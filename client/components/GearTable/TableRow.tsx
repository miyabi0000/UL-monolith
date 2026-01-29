import React from 'react'
import type { GearItemWithCalculated, Category, QuantityDisplayMode } from '../../utils/types'
import {
  EditableImageField,
  EditableTextField,
  EditableCategoryField,
  EditablePriceField,
  EditableWeightField,
  EditableSeasonField,
  QuantitySelector,
  PrioritySelector,
  Currency
} from './EditableFields'

interface TableRowProps {
  item: GearItemWithCalculated
  categories: Category[]
  showCheckboxes: boolean
  isSelected: boolean
  changedFields?: Set<string>
  quantityDisplayMode: QuantityDisplayMode
  currency?: Currency
  onSelectItem: (id: string, checked: boolean) => void
  onUpdateItem: (id: string, field: string, value: any) => void
  onEdit?: (item: GearItemWithCalculated) => void
  /**
   * 編集可能かどうか
   * - true: 編集可能フィールドを表示（通常の編集モード）
   * - false: 読み取り専用表示（通常表示モード、Compareモード）
   */
  isEditable?: boolean
}

const TableRow: React.FC<TableRowProps> = ({
  item,
  categories,
  showCheckboxes,
  isSelected,
  changedFields,
  quantityDisplayMode,
  currency = 'JPY',
  onSelectItem,
  onUpdateItem,
  onEdit,
  isEditable = false
}) => {
  const isFieldChanged = (field: string) => changedFields?.has(field) || false

  const renderQuantityValue = () => {
    switch (quantityDisplayMode) {
      case 'owned':
        return (
          <span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">{item.ownedQuantity}</span>
            <span className="text-gray-400 dark:text-gray-500 mx-0.5">/</span>
            <span className="text-gray-500 dark:text-gray-400">{item.requiredQuantity}</span>
          </span>
        )
      case 'need':
        return (
          <span>
            <span className="text-gray-500 dark:text-gray-400">{item.ownedQuantity}</span>
            <span className="text-gray-400 dark:text-gray-500 mx-0.5">/</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">{item.requiredQuantity}</span>
            {item.shortage > 0 && (
              <span className="ml-1 text-[10px] text-red-500 dark:text-red-400">(-{item.shortage})</span>
            )}
          </span>
        )
      case 'all':
        return (
          <span>
            <span className="text-gray-500 dark:text-gray-400">{item.ownedQuantity}</span>
            <span className="text-gray-400 dark:text-gray-500 mx-0.5">/</span>
            <span className="font-semibold">{item.requiredQuantity}</span>
          </span>
        )
      default:
        return item.ownedQuantity
    }
  }
  return (
    <tr
      className={`transition-colors hover:opacity-90 ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
      }`}
    >
      {/* Checkbox */}
      {showCheckboxes && (
        <td className="px-2 py-1 whitespace-nowrap text-center w-8">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectItem(item.id, e.target.checked)}
            className="rounded w-3 h-3 accent-blue-600 dark:accent-blue-500"
          />
        </td>
      )}

      {/* Image */}
      <td className="px-2 py-1 text-center w-16" style={{ height: '64px' }}>
        <EditableImageField
          value={item.imageUrl || null}
          onChange={(value) => onUpdateItem(item.id, 'imageUrl', value)}
          isEditing={isEditable}
          isChanged={isFieldChanged('imageUrl')}
        />
      </td>

      {/* Name & Brand */}
      <td className="px-2 py-1 min-w-[120px] max-w-[200px]">
        <div className="text-left space-y-1">
          {isEditable ? (
            <>
              <div>
                <label className="block text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">Name</label>
                <EditableTextField
                  value={item.name}
                  onChange={(value) => onUpdateItem(item.id, 'name', value)}
                  isEditing={true}
                  isChanged={isFieldChanged('name')}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">Brand</label>
                <EditableTextField
                  value={item.brand || ''}
                  onChange={(value) => onUpdateItem(item.id, 'brand', value || null)}
                  isEditing={true}
                  isChanged={isFieldChanged('brand')}
                  placeholder="Brand"
                  className="text-xs"
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-medium break-words text-gray-900 dark:text-gray-100 line-clamp-2">
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
                <div className="text-xs break-words text-gray-500 dark:text-gray-400 line-clamp-1">
                  {item.brand}
                </div>
              )}
            </>
          )}
        </div>
      </td>

      {/* Category */}
      <td className="px-2 py-1 whitespace-nowrap text-center w-20">
        <EditableCategoryField
          value={item.categoryId}
          onChange={(value) => onUpdateItem(item.id, 'categoryId', value)}
          isEditing={isEditable}
          isChanged={isFieldChanged('categoryId')}
          categories={categories}
          category={item.category}
        />
      </td>

      {/* Own/Need */}
      <td className="px-2 py-1 whitespace-nowrap text-xs text-center text-gray-900 dark:text-gray-100 w-12">
        {isEditable ? (
          <QuantitySelector
            ownedQuantity={item.ownedQuantity}
            requiredQuantity={item.requiredQuantity}
            onOwnedChange={(value) => onUpdateItem(item.id, 'ownedQuantity', value)}
            onRequiredChange={(value) => onUpdateItem(item.id, 'requiredQuantity', value)}
          />
        ) : (
          renderQuantityValue()
        )}
      </td>

      {/* Weight */}
      <td className="px-2 py-1 whitespace-nowrap text-xs text-center text-gray-900 dark:text-gray-100 w-20">
        <EditableWeightField
          weightGrams={item.weightGrams}
          totalWeight={item.totalWeight}
          requiredQuantity={item.requiredQuantity}
          onChange={(value) => onUpdateItem(item.id, 'weightGrams', value)}
          isEditing={isEditable}
          isChanged={isFieldChanged('weightGrams')}
        />
      </td>

      {/* Priority */}
      <td className="px-2 py-1 whitespace-nowrap text-center w-12">
        <PrioritySelector
          priority={item.priority}
          onChange={(value) => onUpdateItem(item.id, 'priority', value)}
        />
      </td>

      {/* Price */}
      <td className="px-2 py-1 whitespace-nowrap text-xs text-center text-gray-900 dark:text-gray-100 w-16">
        <EditablePriceField
          value={item.priceCents}
          onChange={(value) => onUpdateItem(item.id, 'priceCents', value)}
          isEditing={isEditable}
          isChanged={isFieldChanged('priceCents')}
          currency={currency}
        />
      </td>

      {/* Season */}
      <td
        className="px-2 py-1 text-center w-16"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => isEditable && e.stopPropagation()}
      >
        <EditableSeasonField
          seasons={item.seasons || []}
          onChange={(newSeasons) => onUpdateItem(item.id, 'seasons', newSeasons)}
          isEditing={isEditable}
          isChanged={isFieldChanged('seasons')}
        />
      </td>

      {/* Edit button */}
      {onEdit && !isEditable && (
        <td className="px-2 py-1 text-center w-8">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}
            className="p-1 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </td>
      )}
    </tr>
  )
}

export default TableRow
