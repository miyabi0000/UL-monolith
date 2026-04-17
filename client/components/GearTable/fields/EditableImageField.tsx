import React, { useState } from 'react'
import { BaseFieldProps } from './types'
import ImageEditModal from './ImageEditModal'

interface EditableImageFieldProps extends BaseFieldProps {
  value: string | null
  onChange: (value: string | null) => void
  isEditing: boolean
}

/**
 * ギア画像のインライン表示。編集モード時はクリックで `ImageEditModal` を開き、
 * URL 指定・ローカルファイル添付に対応する。
 */
export const EditableImageField: React.FC<EditableImageFieldProps> = ({
  value,
  onChange,
  isEditing,
}) => {
  const [showModal, setShowModal] = useState(false)
  const [urlInput, setUrlInput] = useState(value || '')

  const handleSave = () => {
    onChange(urlInput || null)
    setShowModal(false)
  }

  const handleClear = () => {
    setUrlInput('')
    onChange(null)
    setShowModal(false)
  }

  const ImageDisplay = ({ clickable = false }: { clickable?: boolean }) => {
    if (!value) {
      return (
        <div
          className={`flex items-center justify-center h-[48px] ${clickable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded' : ''}`}
          onClick={clickable ? () => setShowModal(true) : undefined}
        >
          <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )
    }

    return (
      <div
        className={`flex items-center justify-center h-[48px] ${clickable ? 'cursor-pointer' : ''}`}
        onClick={clickable ? () => setShowModal(true) : undefined}
      >
        <img
          src={value}
          alt="Product"
          className="max-w-[48px] max-h-[48px] w-auto h-auto object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    )
  }

  return (
    <>
      <ImageDisplay clickable={isEditing} />

      {showModal && (
        <ImageEditModal
          urlInput={urlInput}
          onUrlInputChange={setUrlInput}
          onSave={handleSave}
          onClear={handleClear}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
