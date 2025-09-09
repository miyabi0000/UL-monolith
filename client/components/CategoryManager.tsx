import React, { useState } from 'react'
import { Category } from '../../types'

interface CategoryManagerProps {
  categories: Category[]
  onAddCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void
  onEditCategory: (category: Category) => void
  onDeleteCategory: (id: string) => void
  onClose: () => void
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onClose
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#4ECDC4',
    parentId: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCategory) {
      onEditCategory({
        ...editingCategory,
        name: formData.name,
        color: formData.color,
        parentId: formData.parentId || undefined,
        path: formData.parentId 
          ? [...(categories.find(c => c.id === formData.parentId)?.path || []), formData.name]
          : [formData.name]
      })
    } else {
      onAddCategory({
        userId: 'user1',
        name: formData.name,
        color: formData.color,
        parentId: formData.parentId || undefined,
        path: formData.parentId 
          ? [...(categories.find(c => c.id === formData.parentId)?.path || []), formData.name]
          : [formData.name]
      })
    }

    setFormData({ name: '', color: '#4ECDC4', parentId: '' })
    setIsAddingNew(false)
    setEditingCategory(null)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color,
      parentId: category.parentId || ''
    })
    setIsAddingNew(true)
  }

  const handleCancel = () => {
    setFormData({ name: '', color: '#4ECDC4', parentId: '' })
    setIsAddingNew(false)
    setEditingCategory(null)
  }

  const predefinedColors = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#4D96FF', '#A66DFF',
    '#FF8C42', '#6C5CE7', '#00B894', '#FDCB6E', '#E17055'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
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
          {/* Add/Edit Form */}
          {isAddingNew && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category (Optional)
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">No Parent</option>
                    {categories.filter(c => c.id !== editingCategory?.id).map(category => (
                      <option key={category.id} value={category.id}>
                        {category.path.join(' > ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-8 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-mono"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    {editingCategory ? 'Update' : 'Add'} Category
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
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
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
              >
                + Add New Category
              </button>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Categories</h3>
            {categories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No categories yet. Add your first one!</p>
            ) : (
              categories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {category.path.join(' > ')}
                      </div>
                      <div className="text-sm text-gray-500">{category.color}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryManager