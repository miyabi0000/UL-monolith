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
export const sanitizeSeasons = (seasons: unknown): string[] | undefined => {
  if (!seasons) return undefined
  if (!Array.isArray(seasons)) return undefined

  const validSeasons = ['spring', 'summer', 'fall', 'winter']
  return (seasons as unknown[])
    .filter((s): s is string => typeof s === 'string' && validSeasons.includes(s.toLowerCase()))
    .map((s) => s.toLowerCase())
}

/**
 * ギアフォーム用の統合サニタイゼーション
 *
 * 入力は外部 (リクエストボディ等) の不定形データを受けるため `unknown` を
 * 受け取り、内部で in 演算子と typeof で個別にチェックする。
 */
type GearFormFields = Partial<{
  name: string
  brand: string
  productUrl: string
  requiredQuantity: number
  ownedQuantity: number
  weightGrams: number
  priceCents: number
  seasons: unknown
  priority: number
}>

export const sanitizeGearForm = (data: unknown) => {
  const d: GearFormFields = (typeof data === 'object' && data !== null) ? (data as GearFormFields) : {}
  return {
    name: escapeHtml(sanitizeString(d.name ?? '')),
    brand: escapeHtml(sanitizeString(d.brand ?? '')),
    productUrl: sanitizeUrl(d.productUrl ?? ''),
    requiredQuantity: sanitizeNumber(d.requiredQuantity ?? 1, 1, 100) || 1,
    ownedQuantity: sanitizeNumber(d.ownedQuantity ?? 0, 0, 100) || 0,
    weightGrams: d.weightGrams ? sanitizeNumber(d.weightGrams, 0, 10000) : undefined,
    priceCents: d.priceCents ? sanitizeNumber(d.priceCents, 0, 10000000) : undefined,
    seasons: sanitizeSeasons(d.seasons),
    priority: sanitizeNumber(d.priority ?? 3, 1, 5) || 3,
  }
}
