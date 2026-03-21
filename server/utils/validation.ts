/**
 * Input sanitization utilities
 */

/**
 * HTML特殊文字をエスケープ（XSS防止）
 */
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }
  return text.replace(/[&<>"'`=/]/g, (s) => map[s])
}

/**
 * 文字列をトリムし、基本的なクリーンアップを実行
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return ''

  // 制御文字を除去してから最大長を制限
  const withoutControlChars = Array.from(input.trim())
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code >= 0x20 && code !== 0x7f
    })
    .join('')

  return withoutControlChars.slice(0, 500)
}

/**
 * 数値入力のサニタイゼーション
 */
export const sanitizeNumber = (input: string | number, min = 0, max = 999999): number | null => {
  const num = typeof input === 'string' ? parseFloat(input) : input
  if (isNaN(num) || !isFinite(num)) return null
  return Math.max(min, Math.min(max, num))
}

/**
 * URL入力のサニタイゼーション
 */
export const sanitizeUrl = (input: string): string => {
  const sanitized = sanitizeString(input)
  
  // HTTPまたはHTTPSのみ許可
  if (sanitized && !sanitized.match(/^https?:\/\/.+/)) {
    return ''
  }
  
  try {
    new URL(sanitized) // URL妥当性チェック
    return sanitized
  } catch {
    return ''
  }
}

/**
 * Seasons配列のサニタイゼーション
 */
export const sanitizeSeasons = (seasons: any): string[] | undefined => {
  if (!seasons) return undefined
  if (!Array.isArray(seasons)) return undefined

  const validSeasons = ['spring', 'summer', 'fall', 'winter']
  return seasons
    .filter(s => typeof s === 'string' && validSeasons.includes(s.toLowerCase()))
    .map(s => s.toLowerCase())
}

/**
 * ギアフォーム用の統合サニタイゼーション
 */
export const sanitizeGearForm = (data: any) => {
  return {
    name: escapeHtml(sanitizeString(data.name || '')),
    brand: escapeHtml(sanitizeString(data.brand || '')),
    productUrl: sanitizeUrl(data.productUrl || ''),
    requiredQuantity: sanitizeNumber(data.requiredQuantity, 1, 100) || 1,
    ownedQuantity: sanitizeNumber(data.ownedQuantity, 0, 100) || 0,
    weightGrams: data.weightGrams ? sanitizeNumber(data.weightGrams, 0, 10000) : undefined,
    priceCents: data.priceCents ? sanitizeNumber(data.priceCents, 0, 10000000) : undefined,
    seasons: sanitizeSeasons(data.seasons),
    priority: sanitizeNumber(data.priority, 1, 5) || 3
  }
}
