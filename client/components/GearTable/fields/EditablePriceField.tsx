import React, { useState } from 'react'
import { useDebouncedInput } from '../../../hooks/useDebouncedInput'
import { BaseFieldProps, Currency } from './types'
import { ERROR_TONE } from './styles'
import { gearPriceFieldSchema } from '../../../utils/validation'

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

  const [validationError, setValidationError] = useState<string | undefined>(undefined)

  const handleBlurWithValidation = () => {
    handleBlur()
    if (!localValue) {
      setValidationError(undefined)
      return
    }
    const num = parseFloat(localValue)
    if (!Number.isFinite(num)) {
      setValidationError('Please enter a valid number.')
      return
    }
    const cents = Math.round(num) * 100
    const r = gearPriceFieldSchema.safeParse(cents)
    setValidationError(r.success ? undefined : r.error.issues[0]?.message)
  }

  if (isEditing) {
    const showError = !!validationError
    const baseStyle = isChanged || showError ? { borderColor: ERROR_TONE.solid, color: ERROR_TONE.text } : undefined
    return (
      <input
        type="number"
        min="0"
        step="1"
        value={localValue}
        onChange={(e) => {
          handleChange(e.target.value)
          if (validationError) setValidationError(undefined)
        }}
        onFocus={handleFocus}
        onBlur={handleBlurWithValidation}
        placeholder="0"
        title={validationError}
        aria-invalid={showError ? true : undefined}
        className={`w-16 h-6 mx-auto block gear-input-num gear-glass-control px-1 py-0.5 rounded border focus:outline-none focus:ring-2 focus:ring-gray-500 box-border ${showError ? 'input-error' : ''}`}
        style={baseStyle}
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
