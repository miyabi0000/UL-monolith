import React, { useState, useRef, useEffect } from 'react'
import { extractMultipleUrls } from '../../utils/urlHelpers'
import { BULK_URL_MESSAGES } from '../../utils/messages'
import { STATUS_TONES } from '../../utils/designSystem'

// 定数定義
const FOCUS_DELAY_MS = 100
const PERCENTAGE_MULTIPLIER = 100

interface UrlBulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onExtract: (urls: string[]) => void
  onProceed?: () => void
  isExtracting?: boolean
  progress?: {
    total: number
    completed: number
  }
  extractedCount?: number
  failedCount?: number
}

const UrlBulkImportModal: React.FC<UrlBulkImportModalProps> = ({
  isOpen,
  onClose,
  onExtract,
  onProceed,
  isExtracting = false,
  progress = { total: 0, completed: 0 },
  extractedCount = 0,
  failedCount = 0
}) => {
  const infoTone = STATUS_TONES.info
  const errorTone = STATUS_TONES.error
  const successTone = STATUS_TONES.success

  const [urlText, setUrlText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 抽出完了フラグ（初期状態を除外）
  const isProgressComplete = progress.completed > 0 && progress.completed === progress.total
  const hasValidProgress = progress.total > 0
  const extractionComplete = !isExtracting && hasValidProgress && isProgressComplete

  // エラー状態（抽出完了後に全て失敗した場合）
  const isAllFailed = failedCount > 0 && failedCount === progress.total
  const hasError = extractionComplete && isAllFailed

  // モーダルの開閉時の処理を統合
  useEffect(() => {
    if (isOpen) {
      // モーダルが開いたらテキストエリアにフォーカス
      if (textareaRef.current) {
        setTimeout(() => textareaRef.current?.focus(), FOCUS_DELAY_MS)
      }
    } else {
      // モーダルが閉じたら入力をリセット
      setUrlText('')
    }
  }, [isOpen])

  // URLをリアルタイムで検出
  const detectedUrls = extractMultipleUrls(urlText)

  /**
   * URL抽出処理を開始する
   * 検出されたURLリストを親コンポーネントに渡す
   */
  const handleExtract = () => {
    if (detectedUrls.length === 0) return
    onExtract(detectedUrls)
  }

  /**
   * 抽出完了後に次のステップへ進む
   * onProceedが指定されていればそれを呼び出し、なければモーダルを閉じる
   */
  const handleProceedClick = () => {
    if (onProceed) {
      onProceed()
    } else {
      onClose()
    }
  }

  /**
   * キーボードショートカットハンドラ
   * Ctrl/Cmd + Enter で抽出を実行
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleExtract()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay p-4">
      <div className="modal-panel-lg bg-white/90">
        {/* Header */}
        <div className="p-6 border-b border-gray-300">
          <h2 className="text-xl font-semibold text-gray-900">
            {BULK_URL_MESSAGES.MODAL_TITLE}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {BULK_URL_MESSAGES.MODAL_DESCRIPTION}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              {BULK_URL_MESSAGES.LABEL_PRODUCT_URLS}
            </label>
            <textarea
              ref={textareaRef}
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="https://example.com/product-1&#10;https://example.com/product-2&#10;https://example.com/product-3"
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-gray-900 font-mono text-sm resize-none"
              style={{ lineHeight: '1.6' }}
            />
          </div>

          {/* 抽出進捗表示 */}
          {isExtracting && (
            <div
              className="p-4 rounded-md border"
              style={{ backgroundColor: infoTone.background, borderColor: infoTone.border }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium" style={{ color: infoTone.text }}>
                  {BULK_URL_MESSAGES.PROGRESS_ANALYZING(progress.total)}
                </span>
                <span className="text-sm" style={{ color: infoTone.text }}>
                  {BULK_URL_MESSAGES.PROGRESS_STATUS(progress.completed, progress.total)}
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: infoTone.background }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: infoTone.solid,
                    width: `${
                      progress.total > 0
                        ? (progress.completed / progress.total) * PERCENTAGE_MULTIPLIER
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {hasError && (
            <div
              className="p-4 rounded-md border"
              style={{ backgroundColor: errorTone.background, borderColor: errorTone.border }}
            >
              <div className="space-y-2">
                <div className="font-medium" style={{ color: errorTone.text }}>
                  {BULK_URL_MESSAGES.ERROR_TITLE}
                </div>
                <div className="text-sm" style={{ color: errorTone.text }}>
                  {BULK_URL_MESSAGES.ERROR_DESCRIPTION(failedCount)}
                </div>
              </div>
            </div>
          )}

          {/* 抽出完了結果表示（成功がある場合） */}
          {extractionComplete && !hasError && (
            <div
              className="p-4 rounded-md border"
              style={{ backgroundColor: successTone.background, borderColor: successTone.border }}
            >
              <div className="space-y-2">
                <div className="font-medium" style={{ color: successTone.text }}>
                  {BULK_URL_MESSAGES.SUCCESS_TITLE}
                </div>
                <div className="text-sm space-y-1" style={{ color: successTone.text }}>
                  <div>{BULK_URL_MESSAGES.SUCCESS_COUNT(extractedCount)}</div>
                  {failedCount > 0 && (
                    <div style={{ color: errorTone.text }}>
                      {BULK_URL_MESSAGES.FAILED_COUNT(failedCount)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* URL検出状況 */}
          {!isExtracting && !extractionComplete && detectedUrls.length > 0 && (
            <div
              className="p-3 rounded-md border"
              style={{ backgroundColor: infoTone.background, borderColor: infoTone.border }}
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium" style={{ color: infoTone.text }}>
                  {BULK_URL_MESSAGES.URL_DETECTED(detectedUrls.length)}
                </span>
              </div>
              {detectedUrls.length > 5 && (
                <div className="text-xs mt-2 space-y-1" style={{ color: infoTone.text }}>
                  {detectedUrls.slice(0, 3).map((url, idx) => (
                    <div key={idx} className="truncate">• {url}</div>
                  ))}
                  <div className="font-medium">
                    {BULK_URL_MESSAGES.URL_DETECTED_MORE(detectedUrls.length - 3)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ヒント */}
          {!extractionComplete && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>{BULK_URL_MESSAGES.TIP_PASTE_MULTIPLE}</div>
              <div>{BULK_URL_MESSAGES.TIP_SHORTCUT}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-300">
          {!extractionComplete && (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isExtracting}
                className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {BULK_URL_MESSAGES.BUTTON_CANCEL}
              </button>
              <button
                type="button"
                onClick={handleExtract}
                disabled={detectedUrls.length === 0 || isExtracting}
                className="px-4 py-2 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                style={{ backgroundColor: infoTone.solid }}
              >
                {isExtracting && BULK_URL_MESSAGES.BUTTON_EXTRACTING}
                {!isExtracting && BULK_URL_MESSAGES.BUTTON_EXTRACT(detectedUrls.length)}
              </button>
            </>
          )}
          {extractionComplete && hasError && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {BULK_URL_MESSAGES.BUTTON_CLOSE}
            </button>
          )}
          {extractionComplete && !hasError && (
            <button
              type="button"
              onClick={handleProceedClick}
              className="px-4 py-2 rounded-md text-white transition-colors font-medium"
              style={{ backgroundColor: successTone.solid }}
            >
              {BULK_URL_MESSAGES.BUTTON_PROCEED}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default UrlBulkImportModal
