import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Category, WeightClass } from '../../utils/types'
import { getPriorityColor } from '../../utils/designSystem'
import SeasonBar from '../SeasonBar'
import WeightClassBadge from '../ui/WeightClassBadge'

// ==================== デバウンス入力フック ====================
interface UseDebouncedInputOptions<T> {
  value: T
  onChange: (value: T) => void
  delay?: number
  serialize?: (value: T) => string
  deserialize?: (input: string) => T
}

function useDebouncedInput<T>({
  value,
  onChange,
  delay = 300,
  serialize = (v) => String(v ?? ''),
  deserialize = (s) => s as unknown as T
}: UseDebouncedInputOptions<T>) {
  // 関数参照を安定化（無限ループ防止）
  const serializeRef = useRef(serialize)
  const deserializeRef = useRef(deserialize)
  const onChangeRef = useRef(onChange)
  serializeRef.current = serialize
  deserializeRef.current = deserialize
  onChangeRef.current = onChange

  const [localValue, setLocalValue] = useState(() => serializeRef.current(value))
  const [isFocused, setIsFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 親の値が変わったらローカル値を同期（フォーカス中でない場合のみ）
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(serializeRef.current(value))
    }
  }, [value, isFocused])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleChange = useCallback((inputValue: string) => {
    setLocalValue(inputValue)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      onChangeRef.current(deserializeRef.current(inputValue))
    }, delay)
  }, [delay])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    const deserialized = deserializeRef.current(localValue)
    if (deserialized !== value) {
      onChangeRef.current(deserialized)
    }
  }, [localValue, value])

  return { localValue, handleChange, handleFocus, handleBlur }
}

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
          className={`flex items-center justify-center h-[56px] ${clickable ? 'cursor-pointer hover:bg-gray-100 rounded' : ''}`}
          onClick={clickable ? () => setShowModal(true) : undefined}
        >
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )
    }

    return (
      <div
        className={`flex items-center justify-center h-[56px] ${clickable ? 'cursor-pointer' : ''}`}
        onClick={clickable ? () => setShowModal(true) : undefined}
      >
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

  return (
    <>
      <ImageDisplay clickable={isEditing} />

      {/* モーダル */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-96 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Set Image</h3>

            {/* URL入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>

            {/* ファイルアップロード */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center justify-center gap-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="flex items-center justify-center h-40 border border-gray-200 rounded bg-gray-50">
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
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
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
        className={`w-full max-w-full ${className} px-1.5 py-0.5 rounded border ${
          isChanged
            ? 'border-red-500 text-red-600'
            : 'border-gray-300'
        } bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 box-border`}
      />
    )
  }

  return <span className={`${className} text-gray-900`}>{value}</span>
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
            ? 'border-red-500 text-red-600'
            : 'border-gray-300'
        } bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500`}
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
        className={`w-16 text-xs px-1 py-0.5 rounded border ${
          isChanged
            ? 'border-red-500 text-red-600'
            : 'border-gray-300'
        } bg-white text-center focus:outline-none focus:ring-2 focus:ring-gray-500 box-border`}
      />
    )
  }

  if (!value) return <span className="text-xs">-</span>

  const displayValue = currency === 'USD'
    ? (value / 100 / 150).toFixed(0)
    : Math.round(value / 100)

  return <span className="text-xs">{Number(displayValue).toLocaleString()}</span>
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
  const { localValue, handleChange, handleFocus, handleBlur } = useDebouncedInput<number | null>({
    value: weightGrams ?? null,
    onChange,
    serialize: (v) => v?.toString() ?? '',
    deserialize: (s) => s ? parseInt(s) : null
  })

  if (isEditing) {
    return (
      <input
        type="number"
        min="0"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="0"
        className={`w-14 text-xs px-1 py-0.5 rounded border ${
          isChanged
            ? 'border-red-500 text-red-600'
            : 'border-gray-300'
        } bg-white text-center focus:outline-none focus:ring-2 focus:ring-gray-500 box-border`}
      />
    )
  }

  if (!weightGrams) return <span className="text-xs">-</span>

  // 数量が1の場合は単位重量のみ表示
  if (requiredQuantity === 1) {
    return <span className="text-xs font-semibold">{weightGrams.toLocaleString()}</span>
  }

  // 数量が2以上の場合は計算式を表示
  return (
    <div className="text-xs">
      <span className="text-gray-500">{weightGrams} × {requiredQuantity} = </span>
      <span className="font-semibold">{totalWeight.toLocaleString()}</span>
    </div>
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
  const shortage = requiredQuantity - ownedQuantity

  return (
    <div className="flex items-center justify-center gap-1">
      {/* Owned数（強調表示） */}
      <select
        value={ownedQuantity}
        onChange={(e) => onOwnedChange(parseInt(e.target.value))}
        className={`w-7 text-xs font-semibold bg-transparent focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer text-center ${
          ownedQuantity >= requiredQuantity
            ? 'text-green-600'
            : 'text-gray-900'
        }`}
      >
        {Array.from({ length: 11 }, (_, i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <span className="text-gray-300 text-xs">/</span>
      {/* Required数 */}
      <select
        value={requiredQuantity}
        onChange={(e) => onRequiredChange(parseInt(e.target.value))}
        className="w-7 text-xs text-gray-500 bg-transparent focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer text-center"
      >
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i + 1} value={i + 1}>{i + 1}</option>
        ))}
      </select>
      {/* 不足バッジ */}
      {shortage > 0 && (
        <span className="ml-0.5 px-1 py-0.5 text-[10px] font-medium bg-red-100 text-red-600 rounded">
          -{shortage}
        </span>
      )}
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
        className="text-xs bg-white text-gray-900 focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer"
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
        className={`text-xs px-1 py-0.5 rounded border ${
          isChanged
            ? 'border-red-500 text-red-600'
            : 'border-gray-300'
        } bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500`}
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
