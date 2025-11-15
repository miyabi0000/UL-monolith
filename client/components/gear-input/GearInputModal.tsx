import React, { useState, useEffect } from 'react'
import { GearItemWithCalculated, GearItemForm, LLMExtractionResult, Category } from '../../utils/types'
import { ExtractedGearWithUrl } from '../../utils/gearExtractionHelpers'
import { extractFromUrl } from '../../services/llmExtraction'
import { sanitizeGearForm } from '../../utils/helpers'
import { useImageUpload } from '../../hooks/useImageUpload'

interface GearInputModalProps {
  isOpen?: boolean
  gear?: GearItemWithCalculated | null
  editingGear?: GearItemWithCalculated | null
  categories?: Category[]
  onClose: () => void
  onSave: (gear: GearItemForm) => void

  // バルクモード用
  bulkMode?: boolean
  bulkGears?: ExtractedGearWithUrl[]
  onBulkComplete?: (savedCount: number, skippedCount: number) => void
}

const GearInputModal: React.FC<GearInputModalProps> = ({
  gear,
  editingGear,
  categories = [],
  onClose,
  onSave,
  bulkMode = false,
  bulkGears = [],
  onBulkComplete
}) => {
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

  // バルクモード用の状態
  const [currentBulkIndex, setCurrentBulkIndex] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [emptyFields, setEmptyFields] = useState<string[]>([])

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

  /**
   * AI抽出結果から未入力フィールドを検出
   */
  const analyzeExtractionQuality = (extracted: LLMExtractionResult): string[] => {
    const empty: string[] = []
    if (!extracted.name) empty.push('name')
    if (!extracted.brand) empty.push('brand')
    if (!extracted.weightGrams) empty.push('weightGrams')
    if (!extracted.priceCents) empty.push('priceCents')
    if (!extracted.imageUrl) empty.push('imageUrl')
    if (!extracted.suggestedCategory && !extracted.categoryId) empty.push('categoryId')
    return empty
  }

  // 編集モードまたはバルクモードの場合、初期値を設定
  useEffect(() => {
    if (bulkMode && bulkGears.length > 0) {
      // バルクモード: 現在のインデックスのギアを設定
      const currentGear = bulkGears[currentBulkIndex]
      setForm({
        name: currentGear.name || '',
        brand: currentGear.brand || '',
        productUrl: currentGear.url || '',
        imageUrl: currentGear.imageUrl || '',
        categoryId: currentGear.categoryId || '',
        requiredQuantity: currentGear.requiredQuantity || 1,
        ownedQuantity: currentGear.ownedQuantity || 0,
        weightGrams: currentGear.weightGrams,
        priceCents: currentGear.priceCents,
        season: currentGear.season || '',
        priority: currentGear.priority || 3
      })
      setPreview(currentGear.imageUrl || null)
      setEmptyFields(analyzeExtractionQuality(currentGear))
    } else {
      // 通常モード: 編集ギアを設定
      const gearToEdit = editingGear || gear
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
    }
  }, [gear, editingGear, bulkMode, bulkGears, currentBulkIndex])

  /**
   * URLから商品情報を抽出
   */
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // フォームデータをサニタイズ
    const sanitizedForm = sanitizeGearForm(form)

    // 必須フィールドのバリデーション
    if (!sanitizedForm.name.trim()) {
      alert('Product name is required')
      return
    }

    if (bulkMode) {
      // バルクモード: Save & Next
      await onSave(sanitizedForm)
      setSavedCount(prev => prev + 1)

      if (currentBulkIndex < bulkGears.length - 1) {
        setCurrentBulkIndex(prev => prev + 1)
      } else {
        // 完了
        onBulkComplete?.(savedCount + 1, skippedCount)
      }
    } else {
      // 通常モード
      onSave(sanitizedForm)
    }
  }

  const handleChange = (field: keyof GearItemForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))

    // バルクモード: ユーザーが入力したら赤枠を解除
    if (bulkMode && emptyFields.includes(field)) {
      setEmptyFields(prev => prev.filter(f => f !== field))
    }
  }

  /**
   * バルクモード: スキップ処理
   */
  const handleSkip = () => {
    if (!bulkMode) return

    setSkippedCount(prev => prev + 1)

    if (currentBulkIndex < bulkGears.length - 1) {
      setCurrentBulkIndex(prev => prev + 1)
    } else {
      onBulkComplete?.(savedCount, skippedCount + 1)
    }
  }

  /**
   * バルクモード: 前へ
   */
  const handlePrevious = () => {
    if (!bulkMode || currentBulkIndex === 0) return
    setCurrentBulkIndex(prev => prev - 1)
  }

  /**
   * 画像選択時のコールバック
   */
  const onImageSelect = (base64: string) => {
    handleChange('imageUrl', base64)
  }

  /**
   * 画像削除時のコールバック
   */
  const onImageRemove = () => {
    handleChange('imageUrl', '')
  }

  /**
   * フィールドのクラス名を取得（バルクモードで未入力の場合は赤枠）
   */
  const getFieldClassName = (fieldName: string): string => {
    const baseClass = 'input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2'
    if (bulkMode && emptyFields.includes(fieldName)) {
      return `${baseClass} border-red-500 border-2 bg-red-50 dark:bg-red-900/10`
    }
    return baseClass
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
        <div className="p-6 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {bulkMode && `Review Gear (${currentBulkIndex + 1} of ${bulkGears.length})`}
              {!bulkMode && (editingGear || gear) && 'Edit Gear'}
              {!bulkMode && !(editingGear || gear) && 'Add New Gear'}
            </h2>
            {bulkMode && emptyFields.length > 0 && (
              <span className="text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-md border border-yellow-200 dark:border-yellow-700">
                {emptyFields.length} field{emptyFields.length > 1 && 's'} unfilled
              </span>
            )}
          </div>
          {bulkMode && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {savedCount} saved, {skippedCount} skipped
              </p>
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((savedCount + skippedCount) / bulkGears.length) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 画像アップロード（ドラッグ&ドロップ） */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
              Product Image {bulkMode && emptyFields.includes('imageUrl') && <span className="text-red-600">*</span>}
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, onImageSelect)}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              } ${
                !isDragging && bulkMode && emptyFields.includes('imageUrl') && 'border-red-500 bg-red-50 dark:bg-red-900/10'
              } ${
                !isDragging && !(bulkMode && emptyFields.includes('imageUrl')) && 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {imagePreview && (
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
              )}
              {!imagePreview && (
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
                    className="btn-secondary inline-block px-4 py-2 rounded-md cursor-pointer"
                  >
                    Choose Image
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* URL入力 & 抽出 */}
          {!bulkMode && (
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
                  className="btn-primary px-4 py-2 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExtracting && 'Extracting...'}
                  {!isExtracting && 'Extract'}
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
          )}

          {/* バルクモード: URL表示（読み取り専用） */}
          {bulkMode && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Product URL
              </label>
              <input
                type="url"
                value={form.productUrl}
                readOnly
                className="input w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              />
            </div>
          )}

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Product Name * {bulkMode && emptyFields.includes('name') && <span className="text-red-600">!</span>}
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={getFieldClassName('name')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Brand {bulkMode && emptyFields.includes('brand') && <span className="text-red-600">!</span>}
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className={getFieldClassName('brand')}
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
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Weight (grams) {bulkMode && emptyFields.includes('weightGrams') && <span className="text-red-600">!</span>}
              </label>
              <input
                type="number"
                min="0"
                value={form.weightGrams || ''}
                onChange={(e) => handleChange('weightGrams', e.target.value ? parseInt(e.target.value) : undefined)}
                className={getFieldClassName('weightGrams')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Price (¥) {bulkMode && emptyFields.includes('priceCents') && <span className="text-red-600">!</span>}
              </label>
              <input
                type="number"
                min="0"
                value={form.priceCents ? Math.round(form.priceCents / 100) : ''}
                onChange={(e) => handleChange('priceCents', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                className={getFieldClassName('priceCents')}
              />
            </div>
          </div>

          {/* カテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
              Category * {bulkMode && emptyFields.includes('categoryId') && <span className="text-red-600">!</span>}
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className={getFieldClassName('categoryId')}
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
          {bulkMode && (
            <div className="flex justify-between pt-4 border-t border-gray-300 dark:border-gray-700">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel All
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Skip
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentBulkIndex === 0}
                  className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors font-medium"
                >
                  {currentBulkIndex === bulkGears.length - 1 && 'Save & Finish'}
                  {currentBulkIndex !== bulkGears.length - 1 && 'Save & Next →'}
                </button>
              </div>
            </div>
          )}
          {!bulkMode && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-4 py-2 rounded-md"
              >
                {(editingGear || gear) && 'Update'}
                {!(editingGear || gear) && 'Add'} Gear
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default GearInputModal
