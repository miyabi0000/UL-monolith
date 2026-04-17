import React from 'react'
import { Category } from '../../../utils/types'
import { COLORS } from '../../../utils/designSystem'
import CategoryBadge from '../../ui/CategoryBadge'
import { BaseFieldProps } from './types'
import { ERROR_TONE } from './styles'

interface EditableCategoryFieldProps extends BaseFieldProps {
  value: string | undefined
  onChange: (value: string) => void
  isEditing: boolean
  categories: Category[]
  category?: { name: string; color: string }
}

/** カテゴリ。表示時は `CategoryBadge`、編集時は `<select>`。 */
export const EditableCategoryField: React.FC<EditableCategoryFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged,
  categories,
  category,
}) => {
  if (isEditing) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="gear-text-num gear-glass-control px-2 py-1 rounded-md border text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
        style={isChanged ? { borderColor: ERROR_TONE.solid, color: ERROR_TONE.text } : undefined}
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
    <CategoryBadge
      name={category?.name || 'Other'}
      color={category?.color || COLORS.gray[400]}
    />
  )
}
