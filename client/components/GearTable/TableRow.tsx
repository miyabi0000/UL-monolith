import React from 'react'
import type { GearItemWithCalculated, Category, GearFieldValue } from '../../utils/types'
import { STATUS_TONES } from '../../utils/designSystem'
import {
  EditableImageField,
  EditableTextField,
  EditableCategoryField,
  EditablePriceField,
  EditableWeightField,
  EditableSeasonField,
  QuantitySelector,
  PrioritySelector,
} from './EditableFields'
import { useGearListContext } from '../../hooks/useGearListContext'
import RowActionMenu from './RowActionMenu'

interface TableRowProps {
  item: GearItemWithCalculated
  categories: Category[]
  isSelected: boolean
  isHighlighted?: boolean
  /** Chart 側から hover された時の軽いハイライト (selection より弱い) */
  isHovered?: boolean
  /** アドバイザーからのフォーカス対象かどうか（スクロール・ハイライト用） */
  id?: string
  activePackName?: string
  isInActivePack?: boolean
  changedFields?: Set<string>
  onSelectItem: (id: string, checked: boolean) => void
  onUpdateItem: (id: string, field: string, value: GearFieldValue) => void
  onTogglePackItem?: (itemId: string) => void
  /** 行クリックで Chart にセグメント選択を通知 */
  onItemSelect?: (id: string | null) => void
  /** 行 hover で Chart にセグメント強調を通知 */
  onItemHover?: (id: string | null) => void
}

const TableRow: React.FC<TableRowProps> = ({
  item,
  categories,
  isSelected,
  isHighlighted,
  isHovered,
  id,
  activePackName,
  isInActivePack = false,
  changedFields,
  onSelectItem,
  onUpdateItem,
  onTogglePackItem,
  onItemSelect,
  onItemHover,
}) => {
  const {
    showCheckboxes,
    quantityDisplayMode,
    currency,
    editingItemId,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDeleteItem,
  } = useGearListContext()

  const isEditable = editingItemId === item.id
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
      id={id}
      onClick={onItemSelect ? () => onItemSelect(item.id) : undefined}
      onMouseEnter={onItemHover ? () => onItemHover(item.id) : undefined}
      onMouseLeave={onItemHover ? () => onItemHover(null) : undefined}
      className={`gear-table-row transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 ${
        onItemSelect ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'bg-gray-50 dark:bg-gray-700 ring-2 ring-gray-400 dark:ring-gray-500 ring-inset'
          : activePackName && isInActivePack
            ? 'bg-blue-50/55 dark:bg-blue-900/20'
          : isHighlighted
            ? 'border-l-2'
          : isHovered
            ? 'bg-gray-50 dark:bg-gray-700'
            : 'bg-transparent'
      }`}
      style={isHighlighted && !isSelected
        ? { backgroundColor: warningTone.background, borderLeftColor: warningTone.solid }
        : undefined}
    >
      {/* Pack Toggle: 編集中も常時表示 (pack 追加と行編集を独立させるため) */}
      {activePackName && onTogglePackItem && (
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
                ? 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200'
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

      {/* ⋯ Action menu: 非編集時は dropdown (Edit / Delete)、編集時は Save / Cancel */}
      <td className="px-2 py-2 text-center w-16" onClick={(e) => e.stopPropagation()}>
        <RowActionMenu
          isEditing={isEditable}
          onStartEdit={() => onStartEdit(item.id)}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={() => onDeleteItem(item.id)}
        />
      </td>
    </tr>
  )
}

export default React.memo(TableRow)
