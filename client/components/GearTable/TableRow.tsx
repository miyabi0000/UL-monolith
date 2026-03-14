import React from 'react'
import type { GearItemWithCalculated, Category, GearFieldValue } from '../../utils/types'
import { isBig3Category } from '../../utils/types'
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
} from './EditableFields'
import WeightClassBadge from '../ui/WeightClassBadge'
import { useGearListContext } from '../../hooks/useGearListContext'

interface TableRowProps {
  item: GearItemWithCalculated
  categories: Category[]
  isSelected: boolean
  isHighlighted?: boolean
  activePackName?: string
  isInActivePack?: boolean
  changedFields?: Set<string>
  onSelectItem: (id: string, checked: boolean) => void
  onUpdateItem: (id: string, field: string, value: GearFieldValue) => void
  onEdit?: (item: GearItemWithCalculated) => void
  onTogglePackItem?: (itemId: string) => void
}

const TableRow: React.FC<TableRowProps> = ({
  item,
  categories,
  isSelected,
  isHighlighted,
  activePackName,
  isInActivePack = false,
  changedFields,
  onSelectItem,
  onUpdateItem,
  onEdit,
  onTogglePackItem,
}) => {
  const {
    showCheckboxes,
    quantityDisplayMode,
    currency,
    isEditable,
  } = useGearListContext()

  const warningTone = STATUS_TONES.warning
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
            <span className="text-gray-400 dark:text-gray-500 mx-0.5">/</span>
            <span className="text-gray-500 dark:text-gray-300">{item.requiredQuantity}</span>
          </span>
        )
      case 'need':
        return (
          <span className="gear-text-num">
            <span className="text-gray-500 dark:text-gray-300">{item.ownedQuantity}</span>
            <span className="text-gray-400 dark:text-gray-500 mx-0.5">/</span>
            <span className="font-semibold">{item.requiredQuantity}</span>
          </span>
        )
      default:
        return (
          <span className="gear-text-num">
            <span className="text-gray-500 dark:text-gray-300">{item.ownedQuantity}</span>
            <span className="text-gray-400 dark:text-gray-500 mx-0.5">/</span>
            <span className="font-semibold">{item.requiredQuantity}</span>
          </span>
        )
    }
  }

  return (
    <tr
      className={`gear-table-row transition-colors duration-150 hover:bg-gray-50/80 dark:hover:bg-slate-700/45 ${
        isSelected
          ? 'bg-gray-50 dark:bg-slate-700/55 ring-2 ring-gray-400 dark:ring-slate-500 ring-inset'
          : activePackName && isInActivePack
            ? 'bg-emerald-50/55 dark:bg-emerald-900/20'
          : isHighlighted
            ? 'border-l-2'
            : 'bg-transparent'
      }`}
      style={isHighlighted && !isSelected
        ? { backgroundColor: warningTone.background, borderLeftColor: warningTone.solid }
        : undefined}
    >
      {/* Pack Toggle */}
      {activePackName && onTogglePackItem && !isEditable && (
        <td className="px-1 py-2 text-center w-7">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePackItem(item.id)
            }}
            className={[
              'p-0.5 rounded transition-colors',
              isInActivePack
                ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200'
                : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400'
            ].join(' ')}
            title={`${isInActivePack ? 'Remove from' : 'Add to'} ${activePackName}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isInActivePack ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isInActivePack ? 0 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-2-3H6L4 7m16 0v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0H4m8 4v6m-3-3l3 3 3-3" />
            </svg>
          </button>
        </td>
      )}

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
      <td className="px-2 py-2 text-center w-20">
        <EditableImageField
          value={item.imageUrl || null}
          onChange={(value) => onUpdateItem(item.id, 'imageUrl', value)}
          isEditing={isEditable}
          isChanged={isFieldChanged('imageUrl')}
        />
      </td>

      {/* Name & Brand */}
      <td className="px-1.5 py-2 w-[148px] min-w-[112px] max-w-[188px]">
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
                    className="hover:underline transition-colors text-gray-800 dark:text-gray-100"
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
      <td className="px-1.5 py-2 whitespace-nowrap text-left w-28">
        <div className={`inline-flex items-center ${isEditable ? '' : 'max-w-[112px] overflow-hidden'}`}>
          <EditableCategoryField
            value={item.categoryId}
            onChange={(value) => onUpdateItem(item.id, 'categoryId', value)}
            isEditing={isEditable}
            isChanged={isFieldChanged('categoryId')}
            categories={categories}
            category={item.category}
          />
        </div>
      </td>

      {/* Weight Class */}
      <td className="px-1.5 py-2 whitespace-nowrap text-center w-10">
        {isEditable ? (
          <EditableWeightClassField
            value={item.weightClass || 'base'}
            onChange={(value) => onUpdateItem(item.id, 'weightClass', value)}
            isEditing={true}
            isChanged={isFieldChanged('weightClass')}
            isBig3={isBig3Category(item.category)}
          />
        ) : (
          <WeightClassBadge
            weightClass={item.weightClass || 'base'}
            isBig3={isBig3Category(item.category)}
            compact
          />
        )}
      </td>

      {/* Own/Need */}
      <td className="gear-text-num px-2 py-2 whitespace-nowrap text-center w-[88px]">
        <div className="flex h-6 items-center justify-center">
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
        </div>
      </td>

      {/* Weight */}
      <td className="gear-text-num px-1.5 py-2 whitespace-nowrap text-center w-[72px]">
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
      <td className="px-1.5 py-2 whitespace-nowrap text-center w-8">
        <PrioritySelector
          priority={item.priority}
          onChange={(value) => onUpdateItem(item.id, 'priority', value)}
        />
      </td>

      {/* Price */}
      <td className="gear-text-num px-1.5 py-2 whitespace-nowrap text-center w-14">
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
        className="px-1.5 py-2 text-center w-14"
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
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
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
