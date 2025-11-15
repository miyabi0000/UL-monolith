/**
 * アプリケーション全体で使用するメッセージ定数
 * 国際化対応とメッセージ管理の統一を目的とする
 */

/**
 * バルクURL抽出関連のメッセージ
 */
export const BULK_URL_MESSAGES = {
  // モーダルヘッダー
  MODAL_TITLE: 'Add Gear from URLs',
  MODAL_DESCRIPTION: 'Paste product URLs (one per line) and we\'ll extract the information for you',

  // フォームラベル
  LABEL_PRODUCT_URLS: 'Product URLs',

  // プログレス表示
  PROGRESS_ANALYZING: (total: number) => `${total}件のリンクを分析中...`,
  PROGRESS_STATUS: (completed: number, total: number) => `${completed} / ${total} 完了`,

  // エラーメッセージ
  ERROR_TITLE: 'URLから情報を抽出できませんでした',
  ERROR_DESCRIPTION: (failedCount: number) =>
    `${failedCount}件のURLで抽出に失敗しました。URLが正しいか、ページが利用可能か確認してください。`,

  // 成功メッセージ
  SUCCESS_TITLE: '抽出完了',
  SUCCESS_COUNT: (extractedCount: number) => `成功: ${extractedCount}件`,
  FAILED_COUNT: (failedCount: number) => `失敗: ${failedCount}件`,

  // URL検出
  URL_DETECTED: (count: number) => `${count} URL${count > 1 ? 's' : ''} detected`,
  URL_DETECTED_MORE: (remaining: number) => `... and ${remaining} more`,

  // ヒント
  TIP_PASTE_MULTIPLE: 'Tip: Paste multiple URLs at once (one per line)',
  TIP_SHORTCUT: 'Shortcut: Ctrl/Cmd + Enter to extract',

  // ボタン
  BUTTON_CANCEL: 'Cancel',
  BUTTON_EXTRACTING: '抽出中...',
  BUTTON_EXTRACT: (count: number) => `Extract (${count})`,
  BUTTON_CLOSE: '閉じる',
  BUTTON_PROCEED: '確認してレビューへ'
} as const

/**
 * ギア管理関連のメッセージ
 */
export const GEAR_MESSAGES = {
  // 作成・更新・削除
  CREATING: 'アイテムを作成中...',
  UPDATING: 'アイテムを更新中...',
  DELETING: (count: number) => `${count}個のアイテムを削除中...`,

  // 成功メッセージ
  CREATE_SUCCESS: 'アイテムが正常に作成されました',
  UPDATE_SUCCESS: 'アイテムが正常に更新されました',
  DELETE_SUCCESS: (count: number) => `${count}個のアイテムが正常に削除されました`,

  // エラーメッセージ
  CREATE_ERROR: 'アイテムの作成に失敗しました',
  UPDATE_ERROR: 'アイテムの更新に失敗しました',
  DELETE_ERROR: 'アイテムの一括削除に失敗しました',

  // バルク処理
  BULK_COMPLETE: (savedCount: number, skippedCount: number) =>
    `${savedCount}件保存、${skippedCount}件スキップしました`
} as const

/**
 * 認証関連のメッセージ
 */
export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'ログインに成功しました',
  LOGOUT_SUCCESS: 'ログアウトしました',
  LOGIN_ERROR: 'ログインに失敗しました',
  SESSION_EXPIRED: 'セッションが切れました。再度ログインしてください。'
} as const

/**
 * 汎用メッセージ
 */
export const COMMON_MESSAGES = {
  LOADING: '読み込み中...',
  SAVING: '保存中...',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  UNEXPECTED_ERROR: '予期しないエラーが発生しました'
} as const
