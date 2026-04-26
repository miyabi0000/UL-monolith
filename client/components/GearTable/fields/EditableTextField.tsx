import React, { useState } from 'react'
import { useDebouncedInput } from '../../../hooks/useDebouncedInput'
import { BaseFieldProps } from './types'
import { ERROR_TONE } from './styles'
import { gearTextFieldSchemas } from '../../../utils/validation'

type GearTextFieldKey = keyof typeof gearTextFieldSchemas

interface EditableTextFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  isEditing: boolean
  placeholder?: string
  className?: string
  /** バリデーション対象のフィールド種別。指定すれば onBlur で zod 検証を実行 */
  field?: GearTextFieldKey
}

/** テキスト入力。debounce は useDebouncedInput に委譲。 */
export const EditableTextField: React.FC<EditableTextFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged,
  placeholder,
  className = 'text-sm',
  field,
}) => {
  const { localValue, handleChange, handleFocus, handleBlur } = useDebouncedInput({
    value,
    onChange,
  })

  // 局所バリデーションエラー（テーブルセル内のためインライン表示は title に集約）
  const [validationError, setValidationError] = useState<string | undefined>(undefined)

  const handleBlurWithValidation = () => {
    handleBlur()
    if (!field) return
    const schema = gearTextFieldSchemas[field]
    const r = schema.safeParse(localValue)
    setValidationError(r.success ? undefined : r.error.issues[0]?.message)
  }

  if (isEditing) {
    const showError = !!validationError
    // ERROR_TONE は未保存(isChanged) と検証エラー両方で使うが、検証エラー時は title でメッセージを補完
    const baseStyle = isChanged || showError ? { borderColor: ERROR_TONE.solid, color: ERROR_TONE.text } : undefined
    return (
      <input
        type="text"
        value={localValue}
        onChange={(e) => {
          handleChange(e.target.value)
          if (validationError) setValidationError(undefined)
        }}
        onFocus={handleFocus}
        onBlur={handleBlurWithValidation}
        placeholder={placeholder}
        title={validationError}
        aria-invalid={showError ? true : undefined}
        className={`w-full max-w-full ${className} px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 box-border ${showError ? 'input-error' : ''}`}
        style={baseStyle}
      />
    )
  }

  return <span className={`${className} text-gray-900 dark:text-gray-100`}>{value}</span>
}
