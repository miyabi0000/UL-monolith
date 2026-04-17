import React from 'react'
import { useDebouncedInput } from '../../../hooks/useDebouncedInput'
import { BaseFieldProps, Currency } from './types'
import { ERROR_TONE } from './styles'

interface EditablePriceFieldProps extends BaseFieldProps {
  value: number | null | undefined
  onChange: (value: number | null) => void
  isEditing: boolean
  currency?: Currency
}

/** 価格（内部値は円×100 = セント相当）。USD 表示時は 1 USD = 150 JPY で簡易換算。 */
export const EditablePriceField: React.FC<EditablePriceFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged,
  currency = 'JPY',
}) => {
  const { localValue, handleChange, handleFocus, handleBlur } = useDebouncedInput<number | null>({
    value: value ?? null,
    onChange,
    serialize: (v) => (v ? Math.round(v / 100).toString() : ''),
    deserialize: (s) => (s ? Math.round(parseFloat(s)) * 100 : null),
  })

  if (isEditing) {
    return (
      <input
        type="number"
        min="0"
        step="1"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="0"
        className="w-16 h-6 mx-auto block gear-input-num gear-glass-control px-1 py-0.5 rounded border focus:outline-none focus:ring-2 focus:ring-gray-500 box-border"
        style={isChanged ? { borderColor: ERROR_TONE.solid, color: ERROR_TONE.text } : undefined}
      />
    )
  }

  if (value == null) {
    return <span className="gear-empty-value inline-flex h-6 items-center justify-center">—</span>
  }

  if (value < 0) {
    return <span className="gear-anomaly-value inline-flex h-6 items-center justify-center" title="Invalid price">!</span>
  }

  const displayValue = currency === 'USD' ? (value / 100 / 150).toFixed(0) : Math.round(value / 100)

  return (
    <span className="gear-text-num inline-flex h-6 items-center justify-center">
      {Number(displayValue).toLocaleString('ja-JP')}
    </span>
  )
}
