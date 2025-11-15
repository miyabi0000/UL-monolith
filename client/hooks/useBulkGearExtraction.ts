import { useState } from 'react'
import { extractFromUrl } from '../services/llmExtraction'
import { Category } from '../utils/types'
import {
  ExtractedGearWithUrl,
  isFallbackResult,
  enrichExtractionResult
} from '../utils/gearExtractionHelpers'

interface ExtractionResult {
  extractedGears: ExtractedGearWithUrl[]
  failedUrls: string[]
}

interface UseBulkGearExtractionResult {
  extractGears: (urls: string[], categories: Category[]) => Promise<ExtractionResult>
  extractedGears: ExtractedGearWithUrl[]
  failedUrls: string[]
  isExtracting: boolean
  progress: {
    total: number
    completed: number
  }
  // reset internal state (clears extracted results, failed urls and progress)
  reset: () => void
}


/**
 * 複数URLからギア情報を一括抽出するカスタムフック
 */
export function useBulkGearExtraction(): UseBulkGearExtractionResult {
  const [extractedGears, setExtractedGears] = useState<ExtractedGearWithUrl[]>([])
  const [failedUrls, setFailedUrls] = useState<string[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [progress, setProgress] = useState({ total: 0, completed: 0 })

  const extractGears = async (urls: string[], categories: Category[]): Promise<ExtractionResult> => {
    setIsExtracting(true)
    setProgress({ total: urls.length, completed: 0 })
    setExtractedGears([])
    setFailedUrls([])

    try {
      const userCategoryNames = categories.map(cat => cat.name)

      // 全URLを並列処理
      const results = await Promise.allSettled(
        urls.map(url => extractFromUrl(url, userCategoryNames))
      )

      // 成功/失敗を分類
      const successResults: ExtractedGearWithUrl[] = []
      const failedUrlsList: string[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !isFallbackResult(result.value)) {
          // 成功: カテゴリID・URLを付加
          successResults.push(enrichExtractionResult(result.value, urls[index], categories))
        } else {
          // 失敗またはフォールバック
          failedUrlsList.push(urls[index])
        }

        // プログレス更新
        setProgress(prev => ({ ...prev, completed: index + 1 }))
      })

      setExtractedGears(successResults)
      setFailedUrls(failedUrlsList)

      return { extractedGears: successResults, failedUrls: failedUrlsList }
    } catch (error) {
      console.error('Bulk extraction error:', error)
      setFailedUrls(urls)
      return { extractedGears: [], failedUrls: urls }
    } finally {
      setIsExtracting(false)
    }
  }

  // Reset hook state to initial values
  const reset = () => {
    setExtractedGears([])
    setFailedUrls([])
    setProgress({ total: 0, completed: 0 })
    setIsExtracting(false)
  }

  return {
    extractGears,
    extractedGears,
    failedUrls,
    isExtracting,
    progress
    ,
    reset
  }
}
