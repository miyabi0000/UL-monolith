import React from 'react'
import type { GearItemWithCalculated, Category, QuantityDisplayMode } from '../../utils/types'
import { deriveStatus, isBig3Category } from '../../utils/types'
import { STATUS_TONES } from '../../utils/designSystem'
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
  const warningTone = STATUS_TONES.warning
  const status = deriveStatus(item.requiredQuantity, item.ownedQuantity)
  const statusChipTone = status === 'owned'
    ? STATUS_TONES.success
    : status === 'need'
      ? STATUS_TONES.error
      : STATUS_TONES.warning
  const statusChipLabel = status === 'owned' ? 'OWNED' : status === 'need' ? 'NEED' : 'PARTIAL'

  const isFieldChanged = (field: string) => changedFields?.has(field) || false

  const renderQuantityValue = () => {
    if (item.ownedQuantity == null || item.requiredQuantity == null) {
      return <span className="gear-empty-value">—</span>
    }

    if (item.ownedQuantity < 0 || item.requiredQuantity < 1) {
      return <span className="gear-anomaly-value" title="Invalid quantity">!</span>
    }

    switch (quantityDisplayMode) {
      case 'owned':
        return (
          <span className="gear-text-num">
            <span className="font-semibold">{item.ownedQuantity}</span>
            <span className="text-gray-400 mx-0.5">/</span>
            <span className="text-gray-500">{item.requiredQuantity}</span>
          </span>
        )
      case 'need':
        return (
          <span className="gear-text-num">
            <span className="text-gray-500">{item.ownedQuantity}</span>
            <span className="text-gray-400 mx-0.5">/</span>
            <span className="font-semibold">{item.requiredQuantity}</span>
          </span>
        )
      case 'all':
        return (
          <span className="gear-text-num">
            <span className="text-gray-500">{item.ownedQuantity}</span>
            <span className="text-gray-400 mx-0.5">/</span>
            <span className="font-semibold">{item.requiredQuantity}</span>
          </span>
        )
      default:
        return <span className="gear-text-num">{item.ownedQuantity}</span>
    }
  }
  return (
    <tr
      className={`gear-table-row transition-colors duration-150 hover:bg-gray-50/80 ${
        isSelected
          ? 'bg-gray-50 ring-2 ring-gray-400 ring-inset'
          : isHighlighted
            ? 'border-l-2'
            : 'bg-transparent'
      }`}
      style={isHighlighted && !isSelected
        ? { backgroundColor: warningTone.background, borderLeftColor: warningTone.solid }
        : undefined}
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
      <td className="px-2 py-2 text-center w-16">
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
                <label className="gear-text-micro block mb-0.5">Name</label>
                <EditableTextField
                  value={item.name}
                  onChange={(value) => onUpdateItem(item.id, 'name', value)}
                  isEditing={true}
                  isChanged={isFieldChanged('name')}
                  className="gear-text-num"
                />
              </div>
              <div className="w-full">
                <label className="gear-text-micro block mb-0.5">Brand</label>
                <EditableTextField
                  value={item.brand || ''}
                  onChange={(value) => onUpdateItem(item.id, 'brand', value || null)}
                  isEditing={true}
                  isChanged={isFieldChanged('brand')}
                  placeholder="Brand"
                  className="gear-text-num"
                />
              </div>
            </>
          ) : (
            <>
              <div className="gear-text-main break-words line-clamp-2">
                {item.productUrl ? (
                  <a
                    href={item.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline transition-colors text-gray-800"
                  >
                    {item.name}
                  </a>
                ) : (
                  item.name
                )}
              </div>
              {item.brand && (
                <div className="gear-text-sub break-words line-clamp-1">
                  {item.brand}
                </div>
              )}
            </>
          )}
        </div>
      </td>

      {/* Category */}
      <td className="px-2 py-2 whitespace-nowrap text-left w-24">
        <div className={`inline-flex items-center gap-1 ${isEditable ? '' : 'max-w-[128px] overflow-hidden'}`}>
          <EditableCategoryField
            value={item.categoryId}
            onChange={(value) => onUpdateItem(item.id, 'categoryId', value)}
            isEditing={isEditable}
            isChanged={isFieldChanged('categoryId')}
            categories={categories}
            category={item.category}
          />
          <span className="flex-shrink-0">
            <EditableWeightClassField
              value={item.weightClass || 'base'}
              onChange={(value) => onUpdateItem(item.id, 'weightClass', value)}
              isEditing={isEditable}
              isChanged={isFieldChanged('weightClass')}
              isBig3={isBig3Category(item.category)}
            />
          </span>
        </div>
      </td>

      {/* Own/Need */}
      <td className="gear-text-num px-2 py-2 whitespace-nowrap text-center w-[132px]">
        <div className="inline-flex items-center justify-center gap-1.5">
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
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none tracking-[0.03em]"
            style={{ backgroundColor: statusChipTone.background, color: statusChipTone.text }}
            title={statusChipLabel}
          >
            {statusChipLabel}
          </span>
        </div>
      </td>

      {/* Weight */}
      <td className="gear-text-num px-2 py-2 whitespace-nowrap text-center w-20">
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
      <td className="px-1.5 py-2 whitespace-nowrap text-center w-10">
        <PrioritySelector
          priority={item.priority}
          onChange={(value) => onUpdateItem(item.id, 'priority', value)}
        />
      </td>

      {/* Price */}
      <td className="gear-text-num px-2 py-2 whitespace-nowrap text-center w-16">
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
