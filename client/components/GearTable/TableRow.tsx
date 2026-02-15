import React from 'react'
import type { GearItemWithCalculated, Category, QuantityDisplayMode } from '../../utils/types'
import { deriveStatus, isBig3Category } from '../../utils/types'
import StatusBadge from '../ui/StatusBadge'
import {
  EditableImageField,
  EditableTextField,
  EditableCategoryField,
  EditablePriceField,
  EditableWeightField,
  EditableSeasonField,
  EditableWeightClassField,
  QuantitySelector,
  PrioritySelector,
  Currency
} from './EditableFields'

interface TableRowProps {
  item: GearItemWithCalculated
  categories: Category[]
  showCheckboxes: boolean
  isSelected: boolean
  isHighlighted?: boolean
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
  isHighlighted,
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
            <span className="font-semibold text-gray-700">{item.ownedQuantity}</span>
            <span className="text-gray-400 mx-0.5">/</span>
            <span className="text-gray-500">{item.requiredQuantity}</span>
          </span>
        )
      case 'need':
        return (
          <span>
            <span className="text-gray-500">{item.ownedQuantity}</span>
            <span className="text-gray-400 mx-0.5">/</span>
            <span className="font-semibold text-gray-700">{item.requiredQuantity}</span>
            {item.shortage > 0 && (
              <span className="ml-1 text-[10px] text-red-500">(-{item.shortage})</span>
            )}
          </span>
        )
      case 'all':
        return (
          <span>
            <span className="text-gray-500">{item.ownedQuantity}</span>
            <span className="text-gray-400 mx-0.5">/</span>
            <span className="font-semibold">{item.requiredQuantity}</span>
          </span>
        )
      default:
        return item.ownedQuantity
    }
  }
  return (
    <tr
      className={`transition-all duration-200 hover:opacity-90 ${
        isSelected
          ? 'bg-gray-50 ring-2 ring-gray-400 ring-inset'
          : isHighlighted
            ? 'bg-orange-50 border-l-2 border-l-orange-400'
            : 'bg-white'
      }`}
    >
      {/* Checkbox */}
      {showCheckboxes && (
        <td className="px-2 py-2 whitespace-nowrap text-center w-8">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectItem(item.id, e.target.checked)}
            className="rounded w-3 h-3 accent-gray-700"
          />
        </td>
      )}

      {/* Image */}
      <td className="px-2 py-2 text-center w-16" style={{ height: '64px' }}>
        <EditableImageField
          value={item.imageUrl || null}
          onChange={(value) => onUpdateItem(item.id, 'imageUrl', value)}
          isEditing={isEditable}
          isChanged={isFieldChanged('imageUrl')}
        />
      </td>

      {/* Name & Brand */}
      <td className="px-2 py-2 w-[160px] min-w-[120px] max-w-[200px]">
        <div className="text-left space-y-0.5 overflow-hidden">
          {isEditable ? (
            <>
              <div className="w-full">
                <label className="block text-[9px] text-gray-500 mb-0.5">Name</label>
                <EditableTextField
                  value={item.name}
                  onChange={(value) => onUpdateItem(item.id, 'name', value)}
                  isEditing={true}
                  isChanged={isFieldChanged('name')}
                  className="text-xs"
                />
              </div>
              <div className="w-full">
                <label className="block text-[9px] text-gray-500 mb-0.5">Brand</label>
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
              <div className="text-xs font-medium break-words text-gray-900 line-clamp-2">
                {item.productUrl ? (
                  <a
                    href={item.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline transition-colors text-gray-700"
                  >
                    {item.name}
                  </a>
                ) : (
                  item.name
                )}
              </div>
              {item.brand && (
                <div className="text-xs break-words text-gray-500 line-clamp-1">
                  {item.brand}
                </div>
              )}
            </>
          )}
        </div>
      </td>

      {/* Category */}
      <td className="px-2 py-2 whitespace-nowrap text-center w-20">
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
      <td className="px-2 py-2 whitespace-nowrap text-xs text-center text-gray-900 w-12">
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

      {/* Status */}
      <td className="px-2 py-2 whitespace-nowrap text-center w-14">
        <StatusBadge status={deriveStatus(item.requiredQuantity, item.ownedQuantity)} compact />
      </td>

      {/* Weight Class */}
      <td className="px-2 py-2 whitespace-nowrap text-center w-16">
        <EditableWeightClassField
          value={item.weightClass || 'base'}
          onChange={(value) => onUpdateItem(item.id, 'weightClass', value)}
          isEditing={isEditable}
          isChanged={isFieldChanged('weightClass')}
          isBig3={isBig3Category(item.category)}
        />
      </td>

      {/* Weight */}
      <td className="px-2 py-2 whitespace-nowrap text-xs text-center text-gray-900 w-20">
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
      <td className="px-2 py-2 whitespace-nowrap text-center w-12">
        <PrioritySelector
          priority={item.priority}
          onChange={(value) => onUpdateItem(item.id, 'priority', value)}
        />
      </td>

      {/* Price */}
      <td className="px-2 py-2 whitespace-nowrap text-xs text-center text-gray-900 w-16">
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
        className="px-2 py-2 text-center w-16"
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
        <td className="px-2 py-2 text-center w-8">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}
            className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
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

export default React.memo(TableRow)
