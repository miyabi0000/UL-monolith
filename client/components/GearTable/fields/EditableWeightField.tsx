import React from 'react'
import { useDebouncedInput } from '../../../hooks/useDebouncedInput'
import { convertFromGrams, convertToGrams, formatWeight, WeightUnit } from '../../../utils/weightUnit'
import { useWeightUnit } from '../../../contexts/WeightUnitContext'
import { BaseFieldProps } from './types'
import { ERROR_TONE } from './styles'

interface EditableWeightFieldProps extends BaseFieldProps {
  weightGrams: number | null | undefined
  totalWeight: number
  requiredQuantity: number
  onChange: (value: number | null) => void
  isEditing: boolean
}

/**
 * 重量フィールドの内部実装。単位（g/oz）と debounced input を連動させる。
 *
 * 編集中に単位を切り替えると localValue 同期が走らない（useDebouncedInput は value 変更時のみ再同期）
 * ため、Outer 側で `key={unit}` を渡して再マウントさせる（下記の EditableWeightField 参照）。
 */
const EditableWeightFieldInner: React.FC<EditableWeightFieldProps & { unit: WeightUnit }> = ({
  weightGrams,
  totalWeight,
  requiredQuantity,
  onChange,
  isEditing,
  isChanged,
  unit,
}) => {
  const { localValue, handleChange, handleFocus, handleBlur } = useDebouncedInput<number | null>({
    value: weightGrams ?? null,
    onChange,
    // 表示時は現在単位に変換、保存時はグラムへ戻す
    serialize: (v) => (v == null ? '' : convertFromGrams(v, unit).toString()),
    deserialize: (s) => {
      if (!s) return null
      const num = parseFloat(s)
      if (isNaN(num)) return null
      return convertToGrams(num, unit)
    },
  })

  if (isEditing) {
    return (
      <input
        type="number"
        min="0"
        step={unit === 'oz' ? 0.1 : 1}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={unit === 'oz' ? '0.0' : '0'}
        className="w-14 mx-auto block gear-input-num gear-glass-control px-1 py-0.5 rounded border focus:outline-none focus:ring-2 focus:ring-gray-500 box-border"
        style={isChanged ? { borderColor: ERROR_TONE.solid, color: ERROR_TONE.text } : undefined}
      />
    )
  }

  if (weightGrams == null) {
    return <span className="gear-empty-value">—</span>
  }

  if (weightGrams < 0 || requiredQuantity < 1) {
    return <span className="gear-anomaly-value" title="Invalid weight">!</span>
  }

  return <span className="gear-text-num font-semibold">{formatWeight(totalWeight, unit)}</span>
}

/**
 * 重量フィールド。`key={unit}` で単位切替時に Inner を再マウントさせることで
 * debounce 同期の stale 化を避けている（この挙動は load-bearing）。
 */
export const EditableWeightField: React.FC<EditableWeightFieldProps> = (props) => {
  const { unit } = useWeightUnit()
  return <EditableWeightFieldInner key={unit} unit={unit} {...props} />
}
