import React, { useState, useEffect } from 'react'
import { GearItemWithCalculated, GearItemForm, LLMExtractionResult, Category } from '../types'
import { extractFromUrl, adaptToUserCategories } from '../services/llmExtraction'
import { sanitizeGearForm } from '../utils/sanitize'

interface GearFormProps {
  gear?: GearItemWithCalculated | null
  categories?: Category[]
  onClose: () => void
  onSave: (gear: GearItemForm) => void
}

const GearForm: React.FC<GearFormProps> = ({ gear, categories = [], onClose, onSave }) => {
  const [form, setForm] = useState<GearItemForm>({
    name: '',
    brand: '',
    productUrl: '',
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

  // 編集モードの場合、初期値を設定
  useEffect(() => {
    if (gear) {
      setForm({
        name: gear.name,
        brand: gear.brand || '',
        productUrl: gear.productUrl || '',
        categoryId: gear.categoryId || '',
        requiredQuantity: gear.requiredQuantity,
        ownedQuantity: gear.ownedQuantity,
        weightGrams: gear.weightGrams,
        priceCents: gear.priceCents,
        season: gear.season || '',
        priority: gear.priority
      })
    }
  }, [gear])

  // URL抽出（改善版）
  const handleExtractFromUrl = async () => {
    if (!form.productUrl) return

    setIsExtracting(true)
    setExtractionResult(null)
    
    try {
      // 実際のLLM抽出サービスを使用
      const extractedData = await extractFromUrl(form.productUrl)
      
      // ユーザーカテゴリに合わせて調整
      const userCategoryNames = categories.map(cat => cat.name)
      const adaptedResult = adaptToUserCategories(extractedData, userCategoryNames)
      
      setExtractionResult(adaptedResult)
      
      // フォームに自動入力
      setForm(prev => ({
        ...prev,
        name: adaptedResult.name || prev.name,
        brand: adaptedResult.brand || prev.brand,
        weightGrams: adaptedResult.weightGrams || prev.weightGrams,
        priceCents: adaptedResult.priceCents || prev.priceCents,
        // カテゴリIDも設定
        categoryId: categories.find(cat => cat.name === adaptedResult.suggestedCategory)?.id || prev.categoryId
      }))
      
    } catch (error) {
      console.error('Extraction failed:', error)
      // エラーの場合は簡単なフォールバック
      const fallbackResult: LLMExtractionResult = {
        name: 'Unknown Product',
        confidence: 0.1
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {gear ? 'Edit Gear' : 'Add New Gear'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* URL入力 & 抽出 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.productUrl}
                onChange={(e) => handleChange('productUrl', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/product"
              />
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={!form.productUrl || isExtracting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isExtracting ? 'Extracting...' : 'Extract'}
              </button>
            </div>
            
            {/* 抽出結果 */}
            {extractionResult && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800">
                  ✓ Extracted with {Math.round(extractionResult.confidence * 100)}% confidence
                </div>
              </div>
            )}
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 数量 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.requiredQuantity}
                onChange={(e) => handleChange('requiredQuantity', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owned Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.ownedQuantity}
                onChange={(e) => handleChange('ownedQuantity', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 重量・価格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (grams)
              </label>
              <input
                type="number"
                min="0"
                value={form.weightGrams || ''}
                onChange={(e) => handleChange('weightGrams', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (¥)
              </label>
              <input
                type="number"
                min="0"
                value={form.priceCents ? Math.round(form.priceCents / 100) : ''}
                onChange={(e) => handleChange('priceCents', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* カテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.path.join(' > ')}
                </option>
              ))}
            </select>
          </div>

          {/* 季節・優先度 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Season
              </label>
              <select
                value={form.season}
                onChange={(e) => handleChange('season', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All seasons</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1=High, 5=Low)
              </label>
              <select
                value={form.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {gear ? 'Update' : 'Add'} Gear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GearForm






