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
  const fieldClassName = 'input w-full'
  const labelClassName = 'block text-sm font-medium text-gray-700 mb-1'

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
    <div className="modal-overlay">
      <div className="modal-panel-lg">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Gear Item
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className={labelClassName}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={fieldClassName}
              required
            />
          </div>

          {/* Brand */}
          <div>
            <label className={labelClassName}>
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className={fieldClassName}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClassName}>
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className={fieldClassName}
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
            <label className={labelClassName}>
              Product URL
            </label>
            <input
              type="url"
              value={formData.productUrl}
              onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
              className={fieldClassName}
              placeholder="https://..."
            />
          </div>

          {/* Image URL */}
          <div>
            <label className={labelClassName}>
              Image URL
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className={fieldClassName}
              placeholder="https://..."
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="max-w-[200px] max-h-[150px] rounded shadow-sm"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            )}
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Owned Quantity
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.ownedQuantity}
                onChange={(e) => setFormData({ ...formData, ownedQuantity: parseInt(e.target.value) })}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>
                Required Quantity
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.requiredQuantity}
                onChange={(e) => setFormData({ ...formData, requiredQuantity: parseInt(e.target.value) })}
                className={fieldClassName}
              />
            </div>
          </div>

          {/* Weight and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Weight (grams)
              </label>
              <input
                type="number"
                min="0"
                value={formData.weightGrams}
                onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                className={fieldClassName}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClassName}>
                Price (¥)
              </label>
              <input
                type="number"
                min="0"
                value={formData.priceCents}
                onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                className={fieldClassName}
                placeholder="0"
              />
            </div>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Season
            </label>
            <SeasonBar
              seasons={formData.seasons}
              isEditing={true}
              onChange={(newSeasons) => setFormData({ ...formData, seasons: newSeasons as ('spring' | 'summer' | 'fall' | 'winter')[] })}
              size="md"
            />
          </div>

          {/* Priority */}
          <div>
            <label className={labelClassName}>
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
                className="input flex-1"
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
          <div className="flex justify-between pt-4 border-b border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger"
            >
              Delete
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
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
