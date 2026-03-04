import React, { useState, useEffect, useMemo } from 'react'
import { GearItemWithCalculated, GearItemForm, LLMExtractionResult, Category, WeightClass, isBig3Category, DEFAULT_GEAR_VALUES } from '../../utils/types'
import { ExtractedGearWithUrl } from '../../utils/gearExtractionHelpers'
import { extractFromUrl } from '../../services/llmExtraction'
import { sanitizeGearForm } from '../../utils/helpers'
import { useImageUpload } from '../../hooks/useImageUpload'
import { STATUS_TONES } from '../../utils/designSystem'
import Button from '../ui/Button'

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
  const labelClassName = 'block text-sm font-medium mb-1 text-gray-900'
  const inputBaseClass = 'input w-full px-3 py-2 rounded-md focus:outline-none'
  const successTone = STATUS_TONES.success
  const warningTone = STATUS_TONES.warning
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
        requiredQuantity: currentGear.requiredQuantity || DEFAULT_GEAR_VALUES.requiredQuantity,
        ownedQuantity: currentGear.ownedQuantity || DEFAULT_GEAR_VALUES.ownedQuantity,
        weightClass: currentGear.suggestedWeightClass || DEFAULT_GEAR_VALUES.weightClass,
        weightGrams: currentGear.weightGrams,
        weightConfidence: currentGear.weightConfidence || DEFAULT_GEAR_VALUES.weightConfidence,
        weightSource: DEFAULT_GEAR_VALUES.weightSource,
        priceCents: currentGear.priceCents,
        season: currentGear.season || '',
        priority: currentGear.priority || DEFAULT_GEAR_VALUES.priority,
        isInKit: DEFAULT_GEAR_VALUES.isInKit
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
    }
  }, [gear, editingGear, bulkMode, bulkGears, currentBulkIndex])

  // Big3カテゴリ選択時、weightClassを'base'に自動矯正
  useEffect(() => {
    if (isBig3 && form.weightClass !== 'base') {
      setForm(prev => ({ ...prev, weightClass: 'base' }))
    }
  }, [isBig3, form.weightClass])

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
    const baseClass = inputBaseClass
    if (bulkMode && emptyFields.includes(fieldName)) {
      return `${baseClass} border-2`
    }
    return baseClass
  }

  const getFieldStyle = (fieldName: string): React.CSSProperties | undefined => {
    if (bulkMode && emptyFields.includes(fieldName)) {
      return {
        borderColor: errorTone.solid,
        backgroundColor: errorTone.background
      }
    }
    return undefined
  }

  return (
    <div className="modal-overlay p-4">
      <div className="modal-panel-lg">
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {bulkMode && `Review Gear (${currentBulkIndex + 1} of ${bulkGears.length})`}
              {!bulkMode && (editingGear || gear) && 'Edit Gear'}
              {!bulkMode && !(editingGear || gear) && 'Add New Gear'}
            </h2>
            {bulkMode && emptyFields.length > 0 && (
              <span
                className="text-sm px-3 py-1 rounded-md border"
                style={{
                  color: warningTone.text,
                  backgroundColor: warningTone.background,
                  borderColor: warningTone.border
                }}
              >
                {emptyFields.length} field{emptyFields.length > 1 && 's'} unfilled
              </span>
            )}
          </div>
          {bulkMode && (
            <>
              <p className="text-sm text-gray-600 mt-1">
                {savedCount} saved, {skippedCount} skipped
              </p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((savedCount + skippedCount) / bulkGears.length) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 画像アップロード（ドラッグ&ドロップ） */}
          <div>
              <label className={labelClassName}>
              Product Image {bulkMode && emptyFields.includes('imageUrl') && <span style={{ color: errorTone.text }}>*</span>}
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, onImageSelect)}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging && 'border-gray-700 bg-gray-50'
              } ${
                !isDragging && !(bulkMode && emptyFields.includes('imageUrl')) && 'border-gray-300'
              }`}
              style={!isDragging && bulkMode && emptyFields.includes('imageUrl')
                ? { borderColor: errorTone.solid, backgroundColor: errorTone.background }
                : undefined}
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
                    className="absolute top-2 right-2 text-white rounded-full p-1"
                    style={{ width: '24px', height: '24px', backgroundColor: errorTone.solid }}
                  >
                    ✕
                  </button>
                </div>
              )}
              {!imagePreview && (
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
              <label className={labelClassName}>
                Product URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.productUrl}
                  onChange={(e) => handleChange('productUrl', e.target.value)}
                  className={`${inputBaseClass} flex-1`}
                  placeholder="https://example.com/product"
                />
                <Button
                  type="button"
                  onClick={handleExtractFromUrl}
                  disabled={!form.productUrl || isExtracting}
                  variant="primary"
                >
                  {isExtracting && 'Extracting...'}
                  {!isExtracting && 'Extract'}
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
          )}

          {/* バルクモード: URL表示（読み取り専用） */}
          {bulkMode && (
            <div>
              <label className={labelClassName}>
                Product URL
              </label>
              <input
                type="url"
                value={form.productUrl}
                readOnly
                className={`${inputBaseClass} bg-gray-50 text-gray-600`}
              />
            </div>
          )}

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Product Name * {bulkMode && emptyFields.includes('name') && <span style={{ color: errorTone.text }}>!</span>}
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={getFieldClassName('name')}
                style={getFieldStyle('name')}
              />
            </div>

            <div>
              <label className={labelClassName}>
                Brand {bulkMode && emptyFields.includes('brand') && <span style={{ color: errorTone.text }}>!</span>}
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className={getFieldClassName('brand')}
                style={getFieldStyle('brand')}
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
                className={inputBaseClass}
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
                className={inputBaseClass}
              />
            </div>
          </div>

          {/* 重量・価格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Weight (grams) {bulkMode && emptyFields.includes('weightGrams') && <span style={{ color: errorTone.text }}>!</span>}
              </label>
              <input
                type="number"
                min="0"
                value={form.weightGrams || ''}
                onChange={(e) => handleChange('weightGrams', e.target.value ? parseInt(e.target.value) : undefined)}
                className={getFieldClassName('weightGrams')}
                style={getFieldStyle('weightGrams')}
              />
            </div>

            <div>
              <label className={labelClassName}>
                Price (¥) {bulkMode && emptyFields.includes('priceCents') && <span style={{ color: errorTone.text }}>!</span>}
              </label>
              <input
                type="number"
                min="0"
                value={form.priceCents ? Math.round(form.priceCents / 100) : ''}
                onChange={(e) => handleChange('priceCents', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                className={getFieldClassName('priceCents')}
                style={getFieldStyle('priceCents')}
              />
            </div>
          </div>

          {/* カテゴリ選択 */}
          <div>
            <label className={labelClassName}>
              Category * {bulkMode && emptyFields.includes('categoryId') && <span style={{ color: errorTone.text }}>!</span>}
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className={getFieldClassName('categoryId')}
              style={getFieldStyle('categoryId')}
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
                className={`${inputBaseClass} ${
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
                className={inputBaseClass}
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
                className={inputBaseClass}
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
            <div className="flex justify-between pt-4 border-t border-gray-300">
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                >
                  Cancel All
                </Button>
                <Button
                  type="button"
                  onClick={handleSkip}
                  variant="secondary"
                >
                  Skip
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentBulkIndex === 0}
                  variant="secondary"
                >
                  ← Previous
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {currentBulkIndex === bulkGears.length - 1 && 'Save & Finish'}
                  {currentBulkIndex !== bulkGears.length - 1 && 'Save & Next →'}
                </Button>
              </div>
            </div>
          )}
          {!bulkMode && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {(editingGear || gear) && 'Update'}
                {!(editingGear || gear) && 'Add'} Gear
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default GearInputModal
