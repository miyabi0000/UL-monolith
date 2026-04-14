import React, { useState, useRef, useCallback } from 'react'
import { Category, WeightClass } from '../../utils/types'
import { COLORS, STATUS_TONES, getPriorityColor } from '../../utils/designSystem'
import { alpha } from '../../styles/tokens'
import { blue, orange, red, gray } from '../../styles/tokens/primitives'
import SeasonBar from '../SeasonBar'
import WeightClassBadge from '../ui/WeightClassBadge'
import CategoryBadge from '../ui/CategoryBadge'
import { useDebouncedInput } from '../../hooks/useDebouncedInput'
import { convertFromGrams, convertToGrams, formatWeight, WeightUnit } from '../../utils/weightUnit'
import { useWeightUnit } from '../../contexts/WeightUnitContext'

const ERROR_TONE = STATUS_TONES.error
const SUCCESS_TONE = STATUS_TONES.success

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
  const [showModal, setShowModal] = useState(false)
  const [urlInput, setUrlInput] = useState(value || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    onChange(urlInput || null)
    setShowModal(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 画像をData URLに変換
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setUrlInput(dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const ImageDisplay = ({ clickable = false }: { clickable?: boolean }) => {
    if (!value) {
      return (
        <div
          className={`flex items-center justify-center h-[48px] ${clickable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded' : ''}`}
          onClick={clickable ? () => setShowModal(true) : undefined}
        >
          <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )
    }

    return (
      <div
        className={`flex items-center justify-center h-[48px] ${clickable ? 'cursor-pointer' : ''}`}
        onClick={clickable ? () => setShowModal(true) : undefined}
      >
        <img
          src={value}
          alt="Product"
          className="max-w-[48px] max-h-[48px] w-auto h-auto object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    )
  }

  return (
    <>
      <ImageDisplay clickable={isEditing} />

      {/* モーダル */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-panel-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Set Image</h3>

            {/* URL入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 neu-inset focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-slate-400"
              />
            </div>

            {/* ファイルアップロード */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Or upload an image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-100 rounded transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Choose File
              </button>
            </div>

            {/* プレビュー */}
            {urlInput && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <div className="flex items-center justify-center h-40 neu-inset rounded bg-gray-50 dark:bg-slate-800">
                  <img
                    src={urlInput}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* ボタン */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setUrlInput('')
                  onChange(null)
                  setShowModal(false)
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Clear
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-800 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
  const { localValue, handleChange, handleFocus, handleBlur } = useDebouncedInput({
    value,
    onChange
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
        className={`w-full max-w-full ${className} px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 neu-inset focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-slate-400 box-border`}
        style={isChanged ? { borderColor: ERROR_TONE.solid, color: ERROR_TONE.text } : undefined}
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
        className="gear-text-num gear-glass-control px-2 py-1 rounded-md border text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-slate-400"
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

export type Currency = 'JPY' | 'USD'

interface EditablePriceFieldProps extends BaseFieldProps {
  value: number | null | undefined
  onChange: (value: number | null) => void
  isEditing: boolean
  currency?: Currency
}

export const EditablePriceField: React.FC<EditablePriceFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged,
  currency = 'JPY'
}) => {
  const { localValue, handleChange, handleFocus, handleBlur } = useDebouncedInput<number | null>({
    value: value ?? null,
    onChange,
    serialize: (v) => v ? Math.round(v / 100).toString() : '',
    deserialize: (s) => s ? Math.round(parseFloat(s)) * 100 : null
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

  const displayValue = currency === 'USD'
    ? (value / 100 / 150).toFixed(0)
    : Math.round(value / 100)

  return <span className="gear-text-num inline-flex h-6 items-center justify-center">{Number(displayValue).toLocaleString('ja-JP')}</span>
}

interface EditableWeightFieldProps extends BaseFieldProps {
  weightGrams: number | null | undefined
  totalWeight: number
  requiredQuantity: number
  onChange: (value: number | null) => void
  isEditing: boolean
}

// 編集中に単位を切り替えると localValue 同期が走らない（useDebouncedInput は value 変更時のみ再同期）ため、
// Outer 側で key={unit} を渡して再マウントさせる
const EditableWeightFieldInner: React.FC<EditableWeightFieldProps & { unit: WeightUnit }> = ({
  weightGrams,
  totalWeight,
  requiredQuantity,
  onChange,
  isEditing,
  isChanged,
  unit
}) => {
  const { localValue, handleChange, handleFocus, handleBlur } = useDebouncedInput<number | null>({
    value: weightGrams ?? null,
    onChange,
    // 表示時は現在単位に変換、保存時はグラムへ戻す
    serialize: (v) => v == null ? '' : convertFromGrams(v, unit).toString(),
    deserialize: (s) => {
      if (!s) return null
      const num = parseFloat(s)
      if (isNaN(num)) return null
      return convertToGrams(num, unit)
    }
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

export const EditableWeightField: React.FC<EditableWeightFieldProps> = (props) => {
  const { unit } = useWeightUnit()
  return <EditableWeightFieldInner key={unit} unit={unit} {...props} />
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
      className={`flex justify-center ${isChanged ? 'border-2 rounded p-1' : ''}`}
      style={isChanged ? { borderColor: ERROR_TONE.solid } : undefined}
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
    <div className="flex h-6 items-center justify-center gap-1">
      {/* Owned数（強調表示） */}
      <select
        value={ownedQuantity}
        onChange={(e) => onOwnedChange(parseInt(e.target.value))}
        className={`w-7 h-6 gear-input-num font-semibold gear-glass-control rounded border focus:outline-none focus:ring-0 appearance-none cursor-pointer ${
          ownedQuantity >= requiredQuantity
            ? ''
            : 'text-gray-900 dark:text-gray-100'
        }`}
        style={ownedQuantity >= requiredQuantity ? { color: SUCCESS_TONE.text } : undefined}
      >
        {Array.from({ length: 11 }, (_, i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <span className="gear-text-sub text-gray-300 dark:text-gray-500">/</span>
      {/* Required数 */}
      <select
        value={requiredQuantity}
        onChange={(e) => onRequiredChange(parseInt(e.target.value))}
        className="w-7 h-6 gear-input-num text-gray-500 dark:text-gray-300 gear-glass-control rounded border focus:outline-none focus:ring-0 appearance-none cursor-pointer"
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
  const PRIORITY_STYLE: Record<number, { color: string; bg: string; border: string }> = {
    1: { color: blue[700], bg: alpha(blue[500], 0.12), border: alpha(blue[500], 0.3) },
    2: { color: blue[600], bg: alpha(blue[500], 0.08), border: alpha(blue[500], 0.2) },
    3: { color: orange[700], bg: alpha(orange[500], 0.12), border: alpha(orange[500], 0.3) },
    4: { color: orange[800], bg: alpha(orange[500], 0.18), border: alpha(orange[500], 0.4) },
    5: { color: red[700], bg: alpha(red[500], 0.12), border: alpha(red[500], 0.3) },
  }
  const style = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE[3]

  return (
    <div className="flex h-6 items-center justify-center">
      <select
        value={priority}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="gear-priority-token h-6 w-6"
        style={{
          color: style.color,
          backgroundColor: style.bg,
          border: `1px solid ${style.border}`
        }}
        aria-label="Priority"
        title={`Priority ${priority}`}
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

interface EditableWeightClassFieldProps extends BaseFieldProps {
  value: WeightClass
  onChange: (value: WeightClass) => void
  isEditing: boolean
  isBig3?: boolean
}

export const EditableWeightClassField: React.FC<EditableWeightClassFieldProps> = ({
  value,
  onChange,
  isEditing,
  isChanged,
  isBig3 = false
}) => {
  if (isEditing && !isBig3) {
    // Big3カテゴリの場合は常にbaseに固定されるため編集不可
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as WeightClass)}
        className="gear-text-num px-1 py-0.5 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 neu-inset focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-slate-400"
        style={isChanged ? { borderColor: ERROR_TONE.solid, color: ERROR_TONE.text } : undefined}
      >
        <option value="base">Base</option>
        <option value="worn">Worn</option>
        <option value="consumable">Cons</option>
      </select>
    )
  }

  return (
    <WeightClassBadge
      weightClass={value}
      isBig3={isBig3}
      compact
    />
  )
}
