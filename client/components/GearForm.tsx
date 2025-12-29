import React, { useState, useEffect } from 'react'
import { GearItemWithCalculated, GearItemForm, LLMExtractionResult, Category } from '../utils/types'
import { extractFromUrl } from '../services/llmExtraction'
import { sanitizeGearForm } from '../utils/helpers'
import { useImageUpload } from '../hooks/useImageUpload'

interface GearFormProps {
  isOpen?: boolean
  gear?: GearItemWithCalculated | null
  editingGear?: GearItemWithCalculated | null
  categories?: Category[]
  onClose: () => void
  onSave: (gear: GearItemForm) => void
}

const GearForm: React.FC<GearFormProps> = ({ gear, editingGear, categories = [], onClose, onSave }) => {
  const [form, setForm] = useState<GearItemForm>({
    name: '',
    brand: '',
    productUrl: '',
    imageUrl: '',
    categoryId: '',
    requiredQuantity: 1,
    ownedQuantity: 0,
    weightGrams: undefined,
    priceCents: undefined,
    season: '',
    priority: 3
  })
  
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<LLMExtractionResult | null>(null)

  // 画像アップロード機能
  const {
    isDragging,
    imagePreview,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleImageSelect: handleImageFileSelect,
    setPreview,
    removeImage: removeImagePreview
  } = useImageUpload()

  // 編集モードの場合、初期値を設定
  useEffect(() => {
    const gearToEdit = editingGear || gear;
    if (gearToEdit) {
      setForm({
        name: gearToEdit.name,
        brand: gearToEdit.brand || '',
        productUrl: gearToEdit.productUrl || '',
        imageUrl: gearToEdit.imageUrl || '',
        categoryId: gearToEdit.categoryId || '',
        requiredQuantity: gearToEdit.requiredQuantity,
        ownedQuantity: gearToEdit.ownedQuantity,
        weightGrams: gearToEdit.weightGrams,
        priceCents: gearToEdit.priceCents,
        season: gearToEdit.season || '',
        priority: gearToEdit.priority
      })
      setPreview(gearToEdit.imageUrl || null)
    }
  }, [gear, editingGear])

  // URL抽出（改善版）
  const handleExtractFromUrl = async () => {
    if (!form.productUrl) return

    setIsExtracting(true)
    setExtractionResult(null)
    
    try {
      // ユーザーカテゴリ名を取得
      const userCategoryNames = categories.map(cat => cat.name)
      
      // サーバー側で既にカテゴリマッチング済み
      const extractedData = await extractFromUrl(form.productUrl, userCategoryNames)
      
      setExtractionResult(extractedData)

      // フォームに自動入力
      setForm(prev => ({
        ...prev,
        name: extractedData.name || prev.name,
        brand: extractedData.brand || prev.brand,
        imageUrl: extractedData.imageUrl || prev.imageUrl,
        weightGrams: extractedData.weightGrams || prev.weightGrams,
        priceCents: extractedData.priceCents || prev.priceCents,
        // カテゴリIDも設定
        categoryId: categories.find(cat => cat.name === extractedData.suggestedCategory)?.id || prev.categoryId
      }))

      // 画像プレビューも更新
      if (extractedData.imageUrl) {
        setPreview(extractedData.imageUrl)
      }
      
    } catch (error) {
      console.error('Extraction failed:', error)
      // エラーの場合は簡単なフォールバック
      const fallbackResult: LLMExtractionResult = {
        name: 'Unknown Product',
      }
      setExtractionResult(fallbackResult)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // フォームデータをサニタイズ
    const sanitizedForm = sanitizeGearForm(form)
    
    // 必須フィールドのバリデーション
    if (!sanitizedForm.name.trim()) {
      alert('Product name is required')
      return
    }
    
    onSave(sanitizedForm)
  }

  const handleChange = (field: keyof GearItemForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // 画像選択時のコールバック
  const onImageSelect = (base64: string) => {
    handleChange('imageUrl', base64)
  }

  // 画像削除時のコールバック
  const onImageRemove = () => {
    handleChange('imageUrl', '')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
        <div className="p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {(editingGear || gear) ? 'Edit Gear' : 'Add New Gear'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 画像アップロード（ドラッグ&ドロップ） */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
              Product Image
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, onImageSelect)}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImagePreview(onImageRemove)}
                    className="absolute top-2 right-2 bg-red-500 dark:bg-red-600 text-white rounded-full p-1 hover:bg-red-600 dark:hover:bg-red-700"
                    style={{ width: '24px', height: '24px' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm mb-2 text-gray-500 dark:text-gray-400">
                    Drag & drop an image here, or click to select
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileSelect(e, onImageSelect)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="btn-secondary inline-block cursor-pointer"
                  >
                    Choose Image
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* URL入力 & 抽出 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
              Product URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.productUrl}
                onChange={(e) => handleChange('productUrl', e.target.value)}
                className="input flex-1 px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                placeholder="https://example.com/product"
              />
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={!form.productUrl || isExtracting}
                className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExtracting ? 'Extracting...' : 'Extract'}
              </button>
            </div>
            
            {/* 抽出結果 */}
            {extractionResult && (
              <div className="mt-2 p-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30">
                <div className="text-sm text-green-700 dark:text-green-300">
                  ✓ Extracted successfully
                </div>
              </div>
            )}
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
              className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100"
            >
                Product Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              />
            </div>
            
            <div>
              <label 
              className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100"
            >
                Brand
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className="input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* 数量 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
              className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100"
            >
                Required Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.requiredQuantity}
                onChange={(e) => handleChange('requiredQuantity', parseInt(e.target.value) || 0)}
                className="input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              />
            </div>
            
            <div>
              <label 
              className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100"
            >
                Owned Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.ownedQuantity}
                onChange={(e) => handleChange('ownedQuantity', parseInt(e.target.value) || 0)}
                className="input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* 重量・価格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
              className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100"
            >
                Weight (grams)
              </label>
              <input
                type="number"
                min="0"
                value={form.weightGrams || ''}
                onChange={(e) => handleChange('weightGrams', e.target.value ? parseInt(e.target.value) : undefined)}
                className="input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              />
            </div>
            
            <div>
              <label 
              className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100"
            >
                Price (¥)
              </label>
              <input
                type="number"
                min="0"
                value={form.priceCents ? Math.round(form.priceCents / 100) : ''}
                onChange={(e) => handleChange('priceCents', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                className="input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* カテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className="input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* 季節・優先度 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
              className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100"
            >
                Season
              </label>
              <select
                value={form.season}
                onChange={(e) => handleChange('season', e.target.value)}
                className="input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              >
                <option value="">All seasons</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
              </select>
            </div>
            
            <div>
              <label 
              className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100"
            >
                Priority (1=High, 5=Low)
              </label>
              <select
                value={form.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                className="input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              >
                <option value={1}>1 - Critical</option>
                <option value={2}>2 - High</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - Low</option>
                <option value={5}>5 - Optional</option>
              </select>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300 dark:border-gray-700">
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
              {(editingGear || gear) ? 'Update' : 'Add'} Gear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GearForm








