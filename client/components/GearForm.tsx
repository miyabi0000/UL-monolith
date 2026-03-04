import React, { useState, useEffect, useMemo } from 'react'
import { GearItemWithCalculated, GearItemForm, LLMExtractionResult, Category, WeightClass, isBig3Category, DEFAULT_GEAR_VALUES } from '../utils/types'
import { extractFromUrl } from '../services/llmExtraction'
import { sanitizeGearForm } from '../utils/helpers'
import { useImageUpload } from '../hooks/useImageUpload'
import { STATUS_TONES } from '../utils/designSystem'
import Button from './ui/Button'

interface GearFormProps {
  isOpen?: boolean
  gear?: GearItemWithCalculated | null
  editingGear?: GearItemWithCalculated | null
  categories?: Category[]
  onClose: () => void
  onSave: (gear: GearItemForm) => void
}

const GearForm: React.FC<GearFormProps> = ({ gear, editingGear, categories = [], onClose, onSave }) => {
  const labelClassName = 'block text-sm font-medium mb-1 text-gray-900'
  const inputClassName = 'input w-full px-3 py-2 rounded-md focus:outline-none'
  const successTone = STATUS_TONES.success
  const errorTone = STATUS_TONES.error

  const [form, setForm] = useState<GearItemForm>({
    name: '',
    brand: '',
    productUrl: '',
    imageUrl: '',
    categoryId: '',
    requiredQuantity: DEFAULT_GEAR_VALUES.requiredQuantity,
    ownedQuantity: DEFAULT_GEAR_VALUES.ownedQuantity,
    weightClass: DEFAULT_GEAR_VALUES.weightClass,
    weightGrams: undefined,
    weightConfidence: DEFAULT_GEAR_VALUES.weightConfidence,
    weightSource: DEFAULT_GEAR_VALUES.weightSource,
    priceCents: undefined,
    season: '',
    priority: DEFAULT_GEAR_VALUES.priority,
    isInKit: DEFAULT_GEAR_VALUES.isInKit
  })
  
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<LLMExtractionResult | null>(null)

  // 選択中のカテゴリを取得
  const selectedCategory = useMemo(() =>
    categories.find(c => c.id === form.categoryId),
    [categories, form.categoryId]
  )

  // Big3カテゴリかどうか
  const isBig3 = useMemo(() =>
    isBig3Category(selectedCategory),
    [selectedCategory]
  )

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
        weightClass: gearToEdit.weightClass || DEFAULT_GEAR_VALUES.weightClass,
        weightGrams: gearToEdit.weightGrams,
        weightConfidence: gearToEdit.weightConfidence || DEFAULT_GEAR_VALUES.weightConfidence,
        weightSource: gearToEdit.weightSource || DEFAULT_GEAR_VALUES.weightSource,
        priceCents: gearToEdit.priceCents,
        season: gearToEdit.season || '',
        priority: gearToEdit.priority,
        isInKit: gearToEdit.isInKit ?? DEFAULT_GEAR_VALUES.isInKit
      })
      setPreview(gearToEdit.imageUrl || null)
    }
  }, [gear, editingGear])

  // Big3カテゴリ選択時、weightClassを'base'に自動矯正
  useEffect(() => {
    if (isBig3 && form.weightClass !== 'base') {
      setForm(prev => ({ ...prev, weightClass: 'base' }))
    }
  }, [isBig3, form.weightClass])

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
    <div className="modal-overlay p-4">
      <div className="modal-panel-lg">
        <div className="px-6 py-3 border-b border-gray-300 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {(editingGear || gear) ? 'Edit Gear' : 'Add New Gear'}
          </h2>

          {/* ヘッダーボタン */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="gear-form"
              variant="primary"
            >
              {(editingGear || gear) ? 'Update' : 'Add'} Gear
            </Button>
          </div>
        </div>

        <form id="gear-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 画像アップロード（ドラッグ&ドロップ） */}
          <div>
            <label className={labelClassName}>
              Product Image
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, onImageSelect)}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging 
                  ? 'border-gray-700 bg-gray-50'
                  : 'border-gray-300'
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
                    className="absolute top-2 right-2 text-white rounded-full p-1"
                    style={{ backgroundColor: errorTone.solid, width: '24px', height: '24px' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm mb-2 text-gray-500">
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
            <label className={labelClassName}>
              Product URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.productUrl}
                onChange={(e) => handleChange('productUrl', e.target.value)}
                className={`${inputClassName} flex-1`}
                placeholder="https://example.com/product"
              />
              <Button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={!form.productUrl || isExtracting}
                variant="primary"
              >
                {isExtracting ? 'Extracting...' : 'Extract'}
              </Button>
            </div>
            
            {/* 抽出結果 */}
            {extractionResult && (
              <div
                className="mt-2 p-3 rounded-md border"
                style={{ borderColor: successTone.border, backgroundColor: successTone.background }}
              >
                <div className="text-sm" style={{ color: successTone.text }}>
                  ✓ Extracted successfully
                </div>
              </div>
            )}
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Product Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputClassName}
              />
            </div>
            
            <div>
              <label className={labelClassName}>
                Brand
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          {/* 数量 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Required Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.requiredQuantity}
                onChange={(e) => handleChange('requiredQuantity', parseInt(e.target.value) || 0)}
                className={inputClassName}
              />
            </div>
            
            <div>
              <label className={labelClassName}>
                Owned Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.ownedQuantity}
                onChange={(e) => handleChange('ownedQuantity', parseInt(e.target.value) || 0)}
                className={inputClassName}
              />
            </div>
          </div>

          {/* 重量・価格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Weight (grams)
              </label>
              <input
                type="number"
                min="0"
                value={form.weightGrams || ''}
                onChange={(e) => handleChange('weightGrams', e.target.value ? parseInt(e.target.value) : undefined)}
                className={inputClassName}
              />
            </div>
            
            <div>
              <label className={labelClassName}>
                Price (¥)
              </label>
              <input
                type="number"
                min="0"
                value={form.priceCents ? Math.round(form.priceCents / 100) : ''}
                onChange={(e) => handleChange('priceCents', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                className={inputClassName}
              />
            </div>
          </div>

          {/* カテゴリ選択 */}
          <div>
            <label className={labelClassName}>
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className={inputClassName}
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* 会計区分・キット包含 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Weight Class
              </label>
              <select
                value={form.weightClass}
                onChange={(e) => handleChange('weightClass', e.target.value as WeightClass)}
                disabled={isBig3}
                className={`${inputClassName} ${
                  isBig3 ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="base">Base - 背負って運ぶ</option>
                <option value="worn">Worn - 身に着けて運ぶ</option>
                <option value="consumable">Consumable - 消費物</option>
              </select>
              {isBig3 && (
                <p className="mt-1 text-xs text-gray-500">
                  Big3カテゴリのため会計はBaseに固定
                </p>
              )}
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isInKit}
                  onChange={(e) => handleChange('isInKit', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-700 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-900">
                  キットに含める（集計対象）
                </span>
              </label>
            </div>
          </div>

          {/* 季節・優先度 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Season
              </label>
              <select
                value={form.season}
                onChange={(e) => handleChange('season', e.target.value)}
                className={inputClassName}
              >
                <option value="">All seasons</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
              </select>
            </div>
            
            <div>
              <label className={labelClassName}>
                Priority (1=High, 5=Low)
              </label>
              <select
                value={form.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                className={inputClassName}
              >
                <option value={1}>1 - Critical</option>
                <option value={2}>2 - High</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - Low</option>
                <option value={5}>5 - Optional</option>
              </select>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}

export default GearForm




