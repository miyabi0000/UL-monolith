import React, { useState, useEffect } from 'react'
import { GearItemWithCalculated, Category } from '../utils/types'
import SeasonBar from './SeasonBar'
import { getPriorityColor } from '../utils/designSystem'

interface EditGearModalProps {
  isOpen: boolean
  gear: GearItemWithCalculated
  categories: Category[]
  onClose: () => void
  onSave: (id: string, updates: any) => void
  onDelete: (id: string) => void
}

const EditGearModal: React.FC<EditGearModalProps> = ({
  isOpen,
  gear,
  categories,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    name: gear.name,
    brand: gear.brand || '',
    categoryId: gear.categoryId || '',
    productUrl: gear.productUrl || '',
    imageUrl: gear.imageUrl || '',
    requiredQuantity: gear.requiredQuantity,
    ownedQuantity: gear.ownedQuantity,
    weightGrams: gear.weightGrams || '',
    priceCents: gear.priceCents || '',
    seasons: gear.seasons || [],
    priority: gear.priority
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: gear.name,
        brand: gear.brand || '',
        categoryId: gear.categoryId || '',
        productUrl: gear.productUrl || '',
        imageUrl: gear.imageUrl || '',
        requiredQuantity: gear.requiredQuantity,
        ownedQuantity: gear.ownedQuantity,
        weightGrams: gear.weightGrams || '',
        priceCents: gear.priceCents || '',
        seasons: gear.seasons || [],
        priority: gear.priority
      })
    }
  }, [isOpen, gear])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updates = {
      name: formData.name,
      brand: formData.brand || undefined,
      categoryId: formData.categoryId || undefined,
      productUrl: formData.productUrl || undefined,
      imageUrl: formData.imageUrl || undefined,
      requiredQuantity: formData.requiredQuantity,
      ownedQuantity: formData.ownedQuantity,
      weightGrams: formData.weightGrams ? parseInt(String(formData.weightGrams)) : undefined,
      priceCents: formData.priceCents ? parseInt(String(formData.priceCents)) : undefined,
      seasons: formData.seasons,
      priority: formData.priority
    }

    onSave(gear.id, updates)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm(`Delete "${gear.name}"? This action cannot be undone.`)) {
      onDelete(gear.id)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Gear Item
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.path.join(' > ')}
                </option>
              ))}
            </select>
          </div>

          {/* Product URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product URL
            </label>
            <input
              type="url"
              value={formData.productUrl}
              onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="max-w-[200px] max-h-[150px] rounded border border-gray-300 dark:border-gray-600"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            )}
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Owned Quantity
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.ownedQuantity}
                onChange={(e) => setFormData({ ...formData, ownedQuantity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Required Quantity
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.requiredQuantity}
                onChange={(e) => setFormData({ ...formData, requiredQuantity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Weight and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight (grams)
              </label>
              <input
                type="number"
                min="0"
                value={formData.weightGrams}
                onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price (¥)
              </label>
              <input
                type="number"
                min="0"
                value={formData.priceCents}
                onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Season
            </label>
            <SeasonBar
              seasons={formData.seasons}
              isEditing={true}
              onChange={(newSeasons) => setFormData({ ...formData, seasons: newSeasons })}
              size="md"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getPriorityColor(formData.priority) }}
              />
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 - Highest</option>
                <option value={2}>2 - High</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - Low</option>
                <option value={5}>5 - Lowest</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Delete
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditGearModal
