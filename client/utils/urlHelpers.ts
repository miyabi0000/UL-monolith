/**
 * URL操作のヘルパー関数
 */

// URL検出用の正規表現
const URL_REGEX = /https?:\/\/[^\s]+/g

/**
 * テキストから複数のURLを抽出
 * @param text - URL を含むテキスト
 * @returns 抽出された重複なしのURL配列
 */
export function extractMultipleUrls(text: string): string[] {
  const urls = text.match(URL_REGEX) || []
  // 重複排除
  return [...new Set(urls)]
}
