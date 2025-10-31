import React from 'react'
import { GearItemWithCalculated, Category } from '../../utils/types'
import { getPriorityColor } from '../../utils/designSystem'
import { formatPrice } from '../../utils/formatters'
import SeasonBar from '../SeasonBar'

interface BaseFieldProps {
  isChanged?: boolean
}

interface EditableImageFieldProps extends BaseFieldProps {
  value: string | null
  onChange: (value: string | null) => void
  isEditing: boolean
}

export const EditableImageField: React.FC<EditableImageFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged
}) => {
  if (isEditing) {
    return (
      <input
        type="url"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Image URL"
        className={`w-20 text-xs px-1 py-1 rounded border ${
          isChanged
            ? 'border-red-500 text-red-600 dark:text-red-400'
            : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
    )
  }

  if (!value) {
    return (
      <div className="flex items-center justify-center h-[56px]">
        <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-[56px]">
      <img
        src={value}
        alt="Product"
        className="max-w-[80px] max-h-[56px] w-auto h-auto object-contain rounded-md"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}

interface EditableTextFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  isEditing: boolean
  placeholder?: string
  className?: string
}

export const EditableTextField: React.FC<EditableTextFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged,
  placeholder,
  className = 'text-sm'
}) => {
  if (isEditing) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${className} px-2 py-1 rounded border ${
          isChanged
            ? 'border-red-500 text-red-600 dark:text-red-400'
            : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
    )
  }

  return <span className={`${className} text-gray-900 dark:text-gray-100`}>{value}</span>
}

interface EditableCategoryFieldProps extends BaseFieldProps {
  value: string | undefined
  onChange: (value: string) => void
  isEditing: boolean
  categories: Category[]
  category?: { name: string; color: string }
}

export const EditableCategoryField: React.FC<EditableCategoryFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged,
  categories,
  category
}) => {
  if (isEditing) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`text-xs px-2 py-1 rounded-md border ${
          isChanged
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
    )
  }

  return (
    <span
      className="text-xs px-2 py-1 rounded-full font-medium inline-block"
      style={{
        backgroundColor: `${category?.color || '#9CA3AF'}20`,
        color: category?.color || '#9CA3AF',
        border: `1px solid ${category?.color || '#9CA3AF'}40`
      }}
    >
      {category?.name || 'Other'}
    </span>
  )
}

interface EditablePriceFieldProps extends BaseFieldProps {
  value: number | null | undefined
  onChange: (value: number | null) => void
  isEditing: boolean
}

export const EditablePriceField: React.FC<EditablePriceFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged
}) => {
  if (isEditing) {
    return (
      <input
        type="number"
        min="0"
        step="0.01"
        value={value ? (value / 100).toFixed(2) : ''}
        onChange={(e) => {
          const newValue = e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null
          onChange(newValue)
        }}
        placeholder="0.00"
        className={`w-20 text-xs px-1 py-1 rounded border ${
          isChanged
            ? 'border-red-500 text-red-600 dark:text-red-400'
            : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
    )
  }

  return <span className="text-xs">{formatPrice(value)}</span>
}

interface EditableWeightFieldProps extends BaseFieldProps {
  weightGrams: number | null | undefined
  totalWeight: number
  requiredQuantity: number
  onChange: (value: number | null) => void
  isEditing: boolean
}

export const EditableWeightField: React.FC<EditableWeightFieldProps> = ({
  weightGrams,
  totalWeight,
  requiredQuantity,
  onChange,
  isEditing,
  isChanged
}) => {
  if (isEditing) {
    return (
      <input
        type="number"
        min="0"
        value={weightGrams || ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        placeholder="0"
        className={`w-16 text-xs px-1 py-1 rounded border ${
          isChanged
            ? 'border-red-500 text-red-600 dark:text-red-400'
            : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
    )
  }

  if (!weightGrams) return <span className="text-xs">-</span>

  return (
    <>
      <div className="text-xs">{totalWeight}g</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        ({weightGrams}g × {requiredQuantity})
      </div>
    </>
  )
}

interface EditableSeasonFieldProps extends BaseFieldProps {
  seasons: string[]
  onChange: (seasons: string[]) => void
  isEditing: boolean
}

export const EditableSeasonField: React.FC<EditableSeasonFieldProps> = ({
  seasons,
  onChange,
  isEditing,
  isChanged
}) => {
  return (
    <div
      className={`flex justify-center ${isChanged ? 'border-2 border-red-500 rounded p-1' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onMouseDown={(e) => {
        if (isEditing) {
          e.stopPropagation()
        }
      }}
    >
      <SeasonBar
        seasons={seasons}
        isEditing={isEditing}
        size="sm"
        onChange={onChange}
      />
    </div>
  )
}

interface QuantitySelectorProps {
  ownedQuantity: number
  requiredQuantity: number
  onOwnedChange: (value: number) => void
  onRequiredChange: (value: number) => void
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  ownedQuantity,
  requiredQuantity,
  onOwnedChange,
  onRequiredChange
}) => {
  return (
    <div className="flex items-center justify-center space-x-1">
      <select
        value={ownedQuantity}
        onChange={(e) => onOwnedChange(parseInt(e.target.value))}
        className="w-8 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer text-center"
      >
        {Array.from({ length: 11 }, (_, i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <span className="text-gray-400 dark:text-gray-500">/</span>
      <select
        value={requiredQuantity}
        onChange={(e) => onRequiredChange(parseInt(e.target.value))}
        className="w-8 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer text-center"
      >
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i + 1} value={i + 1}>{i + 1}</option>
        ))}
      </select>
    </div>
  )
}

interface PrioritySelectorProps {
  priority: number
  onChange: (value: number) => void
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  priority,
  onChange
}) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: getPriorityColor(priority) }}
      />
      <select
        value={priority}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer"
      >
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={4}>4</option>
        <option value={5}>5</option>
      </select>
    </div>
  )
}
