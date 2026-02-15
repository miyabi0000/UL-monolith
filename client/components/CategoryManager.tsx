import React, { useState } from 'react'
import { Category } from '../utils/types'
import { STATUS_TONES, COLORS } from '../utils/designSystem'

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

  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: COLORS.gray[800]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    
    try {
      if (editingCategory) {
        await onEditCategory?.(editingCategory.id, formData.name, formData.color)
      } else {
        await onAddCategory?.(formData.name, formData.color)
      }

      setFormData({ name: '', color: COLORS.gray[800] })
      setIsAddingNew(false)
      setEditingCategory(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color
    })
    setIsAddingNew(true)
    setError(null)
  }

  const handleCancel = () => {
    setFormData({ name: '', color: COLORS.gray[800] })
    setIsAddingNew(false)
    setEditingCategory(null)
    setError(null)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return
    
    // 連続クリック防止
    if (isSubmitting) return
    
    setError(null)
    setIsSubmitting(true)
    try {
      await onDeleteCategory?.(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const predefinedColors = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#4D96FF', '#A66DFF',
    '#FF8C42', '#6C5CE7', '#00B894', '#FDCB6E', '#E17055'
  ]

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl w-full max-h-[80vh] overflow-y-auto">
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
          {/* Error Display */}
          {error && (
            <div
              className="mb-4 p-3 border rounded-md text-sm"
              style={{
                backgroundColor: errorTone.background,
                borderColor: errorTone.border,
                color: errorTone.text
              }}
            >
              {error}
            </div>
          )}

          {/* Add/Edit Form */}
          {isAddingNew && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Hiking Poles, Hydration"
                    maxLength={50}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value.toUpperCase() })}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value.toUpperCase() })}
                      className="input text-sm font-mono"
                      pattern="^#[0-9A-F]{6}$"
                      placeholder="#404040"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:scale-110 transition-transform disabled:opacity-50"
                        style={{ backgroundColor: color }}
                        disabled={isSubmitting}
                        title={color}
                      />
                    ))}
                  </div>
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
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
