import React from 'react'
import { useDebouncedInput } from '../../../hooks/useDebouncedInput'
import { BaseFieldProps } from './types'
import { ERROR_TONE } from './styles'

interface EditableTextFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  isEditing: boolean
  placeholder?: string
  className?: string
}

/** テキスト入力。debounce は useDebouncedInput に委譲。 */
export const EditableTextField: React.FC<EditableTextFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged,
  placeholder,
  className = 'text-sm',
}) => {
  const { localValue, handleChange, handleFocus, handleBlur } = useDebouncedInput({
    value,
    onChange,
  })

  if (isEditing) {
    return (
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full max-w-full ${className} px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 box-border`}
        style={isChanged ? { borderColor: ERROR_TONE.solid, color: ERROR_TONE.text } : undefined}
      />
    )
  }

  return <span className={`${className} text-gray-900 dark:text-gray-100`}>{value}</span>
}
