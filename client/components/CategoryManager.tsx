import React, { useState } from 'react'
import { Category } from '../utils/types'
import { STATUS_TONES } from '../utils/designSystem'
import { DEFAULT_JAPANESE_COLOR, JAPANESE_COLOR_HEX_SET, JAPANESE_COLOR_PALETTE } from '../utils/japaneseColors'
import { useFormValidation } from '../hooks/useFormValidation'
import { categorySchema } from '../utils/validation'
import { FieldError } from './ui/FieldError'

interface CategoryManagerProps {
  categories: Category[]
  onAddCategory?: (name: string, color: string) => Promise<void>
  onEditCategory?: (id: string, name: string, color: string) => Promise<void>
  onDeleteCategory?: (id: string) => Promise<void>
  onClose: () => void
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onClose
}) => {
  const errorTone = STATUS_TONES.error

  // 既存パレットから 1 色目を初期値とする（DEFAULT_JAPANESE_COLOR はパレット外のため
  // form 開始時から validation 適合させる）
  const INITIAL_COLOR =
    JAPANESE_COLOR_HEX_SET.has(DEFAULT_JAPANESE_COLOR as Parameters<typeof JAPANESE_COLOR_HEX_SET.has>[0])
      ? DEFAULT_JAPANESE_COLOR
      : JAPANESE_COLOR_PALETTE[0].hex

  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<{ name: string; color: string }>({
    name: '',
    color: INITIAL_COLOR
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { errors, validate, validateField, setFieldError, clearErrors } =
    useFormValidation(categorySchema)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    const result = validate(formData)
    if (!result.ok) return

    setIsSubmitting(true)
    try {
      if (editingCategory) {
        await onEditCategory?.(editingCategory.id, result.data.name, result.data.color)
      } else {
        await onAddCategory?.(result.data.name, result.data.color)
      }

      setFormData({ name: '', color: INITIAL_COLOR })
      setIsAddingNew(false)
      setEditingCategory(null)
    } catch (err) {
      setFieldError('_form', err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    const normalizedColor = JAPANESE_COLOR_HEX_SET.has(category.color as Parameters<typeof JAPANESE_COLOR_HEX_SET.has>[0])
      ? category.color
      : INITIAL_COLOR
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: normalizedColor
    })
    setIsAddingNew(true)
    clearErrors()
  }

  const handleCancel = () => {
    setFormData({ name: '', color: INITIAL_COLOR })
    setIsAddingNew(false)
    setEditingCategory(null)
    clearErrors()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return

    // 連続クリック防止
    if (isSubmitting) return

    clearErrors()
    setIsSubmitting(true)
    try {
      await onDeleteCategory?.(id)
    } catch (err) {
      setFieldError('_form', err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel-lg max-h-[80vh]">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Category Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* フォーム全体のエラー（サーバー由来等）。フィールド単位は input 直下で表示 */}
          {errors._form && (
            <div
              role="alert"
              className="mb-4 p-3 border rounded-md text-sm"
              style={{
                backgroundColor: errorTone.background,
                borderColor: errorTone.border,
                color: errorTone.text
              }}
            >
              {errors._form}
            </div>
          )}

          {/* Add/Edit Form */}
          {isAddingNew && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (errors.name) setFieldError('name', undefined)
                    }}
                    onBlur={() => validateField('name', formData.name)}
                    className={`input w-full ${errors.name ? 'input-error' : ''}`}
                    placeholder="e.g., Hiking Poles, Hydration"
                    maxLength={50}
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? 'category-name-error' : undefined}
                    disabled={isSubmitting}
                  />
                  <FieldError id="category-name-error" message={errors.name} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Japanese Color Palette
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {JAPANESE_COLOR_PALETTE.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, color: color.hex })
                          if (errors.color) setFieldError('color', undefined)
                        }}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all disabled:opacity-50 ${
                          formData.color === color.hex
                            ? 'border-2 border-gray-700 bg-gray-100'
                            : 'shadow-sm bg-white'
                        }`}
                        disabled={isSubmitting}
                        title={`${color.name} (${color.hex})`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs text-gray-700">{color.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 font-mono">
                    Selected: {formData.color}
                  </div>
                  <FieldError message={errors.color} />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Add'} Category
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add New Button */}
          {!isAddingNew && (
            <div className="mb-6">
              <button
                onClick={() => setIsAddingNew(true)}
                className="btn-primary"
              >
                + Add New Category
              </button>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Existing Categories ({categories.length})
            </h3>
            {categories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No categories yet. Add your first one!</p>
            ) : (
              <div className="grid gap-2">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 shadow-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-5 h-5 rounded-full shadow-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{category.color}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="px-3 py-1 rounded text-sm font-medium transition-colors"
                        style={{ color: errorTone.text }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryManager
