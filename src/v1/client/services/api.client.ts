/**
 * API Configuration - Production Ready
 */

export const API_CONFIG = {
  // Backend API Base URL
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',

  // Timeout configuration - 段階的タイムアウト
  timeout: {
    // 標準API呼び出し: 30秒
    standard: 30000,
    // 重い処理（URL解析、リスト分析）: 60秒  
    heavy: 60000,
    // 軽量処理（ヘルスチェック）: 10秒
    light: 10000,
  },

  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000, // 1秒
    backoff: 2, // 指数バックオフ
  }
} as const

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Backend LLM API
  llm: {
    extractGear: '/llm/extract-gear',           // プロンプトからギア抽出
    extractUrl: '/llm/extract-url',             // URLからギア抽出（スクレイピング含む）
    enhanceWithPrompt: '/llm/enhance-prompt',   // URL+プロンプト併用
    extractCategory: '/llm/extract-category',   // カテゴリ抽出
    analyzeList: '/llm/analyze-list',          // ギアリスト分析
    healthCheck: '/llm/health',                // API疎通確認
  }
}

/**
 * Request headers
 */
export const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  }
}

/**
 * タイムアウト付きfetch
 */
export const fetchWithTimeout = async (
  url: string, 
  options: RequestInit, 
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController()
  
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

/**
 * リトライ機能付きAPI呼び出し
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const callAPIWithRetry = async (
  endpoint: string,
  data: any,
  timeoutMs = API_CONFIG.timeout.standard
): Promise<any> => {
  const { attempts, delay, backoff } = API_CONFIG.retry
  let lastError: Error

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const url = `${API_CONFIG.baseUrl}${endpoint}`
      
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }, timeoutMs)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(`HTTP ${response.status}: ${errorData.message || 'API request failed'}`)
        
        // 4xx エラーはリトライしない
        if (response.status >= 400 && response.status < 500) {
          throw error
        }
        
        // 5xx エラーはリトライ対象
        lastError = error
        throw error
      }

      return await response.json()
    } catch (error) {
      lastError = error as Error
      
      // 最後の試行でない場合はリトライ
      if (attempt < attempts) {
        const waitTime = delay * Math.pow(backoff, attempt - 1)
        console.warn(`API呼び出し失敗 (${attempt}/${attempts}), ${waitTime}ms後にリトライ:`, error)
        await sleep(waitTime)
        continue
      }
      
      // 最後の試行も失敗
      throw lastError
    }
  }

  throw lastError!
}