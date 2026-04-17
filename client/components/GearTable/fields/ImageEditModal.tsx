import React, { useRef } from 'react'

interface ImageEditModalProps {
  urlInput: string
  onUrlInputChange: (value: string) => void
  onSave: () => void
  onClear: () => void
  onClose: () => void
}

/**
 * 画像 URL 入力 / ローカルファイル添付 / プレビューを兼ねるモーダル。
 * `EditableImageField` から開かれる。
 */
const ImageEditModal: React.FC<ImageEditModalProps> = ({
  urlInput,
  onUrlInputChange,
  onSave,
  onClear,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 画像を Data URL に変換
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        onUrlInputChange(dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Set Image</h3>

        {/* URL 入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => onUrlInputChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
          />
        </div>

        {/* ファイルアップロード */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or upload an image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100 rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Choose File
          </button>
        </div>

        {/* プレビュー */}
        {urlInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </label>
            <div className="flex items-center justify-center h-40 bg-gray-50 rounded bg-gray-50 dark:bg-gray-800">
              <img
                src={urlInput}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-800 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageEditModal
