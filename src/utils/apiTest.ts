import { checkAPIHealth } from '../services/llmExtraction'
import { testBackendConnection } from '../services/backendApiService'

/**
 * API接続状況のテスト
 */
export async function runAPITests(): Promise<{
  health: boolean
  backend: boolean
  message: string
}> {
  console.group('🔍 API接続テスト開始')
  
  try {
    // LLMサービスヘルスチェック
    console.log('1. LLMサービスヘルスチェック...')
    const healthResult = await checkAPIHealth()
    console.log(`   結果: ${healthResult ? '✅ 正常' : '❌ 異常'}`)

    // バックエンド接続テスト
    console.log('2. バックエンド接続テスト...')
    const backendResult = await testBackendConnection()
    console.log(`   結果: ${backendResult ? '✅ 接続成功' : '❌ 接続失敗'}`)

    let message = ''
    if (healthResult && backendResult) {
      message = '✅ すべてのAPIが正常に動作しています'
    } else if (healthResult && !backendResult) {
      message = '⚠️ LLMは正常、バックエンド接続に問題があります（モックモードで動作）'
    } else if (!healthResult && backendResult) {
      message = '⚠️ バックエンドは接続可能、LLMサービスに問題があります'
    } else {
      message = '❌ APIサービスに接続できません（モックモードで動作）'
    }

    console.log(`\n📋 テスト結果: ${message}`)
    console.groupEnd()

    return {
      health: healthResult,
      backend: backendResult,
      message
    }
  } catch (error) {
    const errorMessage = `❌ API接続テスト中にエラー: ${error instanceof Error ? error.message : '不明なエラー'}`
    console.error(errorMessage)
    console.groupEnd()
    
    return {
      health: false,
      backend: false,
      message: errorMessage
    }
  }
}

/**
 * 設定状況の確認
 */
export function checkConfiguration(): {
  isRealAPIEnabled: boolean
  hasBackendURL: boolean
  message: string
} {
  const isRealAPIEnabled = import.meta.env.VITE_ENABLE_REAL_API === 'true'
  const backendURL = import.meta.env.VITE_API_BASE_URL
  const hasBackendURL = !!backendURL

  let message = ''
  if (isRealAPIEnabled && hasBackendURL) {
    message = `🔗 実APIモード有効 (Backend: ${backendURL})`
  } else if (!isRealAPIEnabled) {
    message = '🔧 モックモード (VITE_ENABLE_REAL_API=falseまたは未設定)'
  } else if (!hasBackendURL) {
    message = '⚠️ バックエンドURLが未設定'
  }

  console.log(`📋 設定状況: ${message}`)

  return {
    isRealAPIEnabled,
    hasBackendURL,
    message
  }
}

/**
 * 開発者向けAPI接続デバッグ情報
 */
export async function logAPIDebugInfo(): Promise<void> {
  console.group('🔧 API接続デバッグ情報')
  
  // 設定確認
  const config = checkConfiguration()
  console.log('設定:', config)

  // 環境変数確認
  console.log('環境変数:')
  console.log('  VITE_ENABLE_REAL_API:', import.meta.env.VITE_ENABLE_REAL_API)
  console.log('  VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
  
  // API接続テスト
  if (config.isRealAPIEnabled) {
    await runAPITests()
  } else {
    console.log('💡 実API無効のため、接続テストはスキップ')
  }

  console.groupEnd()
}