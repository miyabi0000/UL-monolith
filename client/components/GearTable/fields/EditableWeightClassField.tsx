import React from 'react'
import { WeightClass } from '../../../utils/types'
import WeightClassBadge from '../../ui/WeightClassBadge'
import { BaseFieldProps } from './types'
import { ERROR_TONE } from './styles'

interface EditableWeightClassFieldProps extends BaseFieldProps {
  value: WeightClass
  onChange: (value: WeightClass) => void
  isEditing: boolean
  isBig3?: boolean
}

/**
 * 重量クラス（base / worn / consumable）。Big3 カテゴリの場合は base に固定され編集不可。
 */
export const EditableWeightClassField: React.FC<EditableWeightClassFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged,
  isBig3 = false,
}) => {
  if (isEditing && !isBig3) {
    // Big3 カテゴリの場合は常に base に固定されるため編集不可
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as WeightClass)}
        className="gear-text-num px-1 py-0.5 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
        style={isChanged ? { borderColor: ERROR_TONE.solid, color: ERROR_TONE.text } : undefined}
      >
        <option value="base">Base</option>
        <option value="worn">Worn</option>
        <option value="consumable">Cons</option>
      </select>
    )
  }

  return <WeightClassBadge weightClass={value} isBig3={isBig3} compact />
}
