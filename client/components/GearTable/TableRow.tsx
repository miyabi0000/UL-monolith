import React from 'react'
import { GearItemWithCalculated, Category } from '../../utils/types'
import {
  EditableImageField,
  EditableTextField,
  EditableCategoryField,
  EditablePriceField,
  EditableWeightField,
  EditableSeasonField,
  QuantitySelector,
  PrioritySelector
} from './EditableFields'

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
        <EditableImageField
          value={item.imageUrl || null}
          onChange={(value) => onUpdateItem(item.id, 'imageUrl', value)}
          isEditing={showCheckboxes}
          isChanged={isFieldChanged('imageUrl')}
        />
      </td>

      {/* Name & Brand */}
      <td className="px-2 py-1">
        <div className="text-left">
          {showCheckboxes ? (
            <EditableTextField
              value={item.name}
              onChange={(value) => onUpdateItem(item.id, 'name', value)}
              isEditing={true}
              isChanged={isFieldChanged('name')}
              className="text-sm"
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
            <div className="mt-1">
              <EditableTextField
                value={item.brand || ''}
                onChange={(value) => onUpdateItem(item.id, 'brand', value || null)}
                isEditing={true}
                isChanged={isFieldChanged('brand')}
                placeholder="Brand"
                className="text-xs"
              />
            </div>
          ) : item.brand ? (
            <div className="text-xs break-words text-gray-500 dark:text-gray-400">
              {item.brand}
            </div>
          ) : null}
        </div>
      </td>

      {/* Category */}
      <td className="px-2 py-1 whitespace-nowrap text-center">
        <EditableCategoryField
          value={item.categoryId}
          onChange={(value) => onUpdateItem(item.id, 'categoryId', value)}
          isEditing={showCheckboxes}
          isChanged={isFieldChanged('categoryId')}
          categories={categories}
          category={item.category}
        />
      </td>

      {/* Own/Need */}
      <td className="px-2 py-1 whitespace-nowrap text-xs text-center text-gray-900 dark:text-gray-100">
        <QuantitySelector
          ownedQuantity={item.ownedQuantity}
          requiredQuantity={item.requiredQuantity}
          onOwnedChange={(value) => onUpdateItem(item.id, 'ownedQuantity', value)}
          onRequiredChange={(value) => onUpdateItem(item.id, 'requiredQuantity', value)}
        />
      </td>

      {/* Weight */}
      <td className="px-2 py-1 whitespace-nowrap text-xs text-center text-gray-900 dark:text-gray-100">
        <EditableWeightField
          weightGrams={item.weightGrams}
          totalWeight={item.totalWeight}
          requiredQuantity={item.requiredQuantity}
          onChange={(value) => onUpdateItem(item.id, 'weightGrams', value)}
          isEditing={showCheckboxes}
          isChanged={isFieldChanged('weightGrams')}
        />
      </td>

      {/* Priority */}
      <td className="px-2 py-1 whitespace-nowrap text-center">
        <PrioritySelector
          priority={item.priority}
          onChange={(value) => onUpdateItem(item.id, 'priority', value)}
        />
      </td>

      {/* Price */}
      <td className="px-2 py-1 whitespace-nowrap text-xs text-center text-gray-900 dark:text-gray-100">
        <EditablePriceField
          value={item.priceCents}
          onChange={(value) => onUpdateItem(item.id, 'priceCents', value)}
          isEditing={showCheckboxes}
          isChanged={isFieldChanged('priceCents')}
        />
      </td>

      {/* Season */}
      <td
        className="px-2 py-1 text-center"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => showCheckboxes && e.stopPropagation()}
      >
        <EditableSeasonField
          seasons={item.seasons || []}
          onChange={(newSeasons) => onUpdateItem(item.id, 'seasons', newSeasons)}
          isEditing={showCheckboxes}
          isChanged={isFieldChanged('seasons')}
        />
      </td>
    </tr>
  )
}

export default TableRow
