import { darkenColor, darkenHslColor } from '../../utils/colorHelpers'

/**
 * グラデーション用の色操作ヘルパー
 */

/**
 * HEX 色を明るくする。
 * `#RRGGBB` を受け取り、各チャネルを 255 に向かって amount 比で線形補間する。
 */
export const lightenHexColor = (color: string, amount: number = 0.2): string => {
  const hex = color.replace('#', '')
  if (hex.length !== 6) return color
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const clamped = Math.max(0, Math.min(1, amount))
  const newR = Math.min(255, Math.round(r + (255 - r) * clamped))
  const newG = Math.min(255, Math.round(g + (255 - g) * clamped))
  const newB = Math.min(255, Math.round(b + (255 - b) * clamped))
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

/** HSL 色を明るくする。 `hsl(h, s%, l%)` → lightness を上げる。 */
export const lightenHslColor = (hslColor: string, amount: number = 0.2): string => {
  const m = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!m) return hslColor
  const h = parseInt(m[1])
  const s = parseInt(m[2])
  const l = parseInt(m[3])
  const newL = Math.min(100, Math.round(l + (100 - l) * Math.max(0, Math.min(1, amount))))
  return `hsl(${h}, ${s}%, ${newL}%)`
}

/**
 * HEX / HSL どちらの色でも「highlight / base / shadow」の 3 階調を返す。
 * radialGradient の stop で立体感を出すために使う。
 */
export const toShades = (color: string): { highlight: string; base: string; shadow: string } => {
  if (color.startsWith('hsl')) {
    return {
      highlight: lightenHslColor(color, 0.35),
      base: color,
      shadow: darkenHslColor(color, 0.35),
    }
  }
  return {
    highlight: lightenHexColor(color, 0.32),
    base: color,
    shadow: darkenColor(color, 0.35),
  }
}

/**
 * Chart エントリ ID (カテゴリ名 / アイテム ID) を、
 * SVG `<defs>` 内で一意に参照可能な安全な ID 文字列に変換する。
 */
export const sanitizeDefId = (prefix: string, raw: string | number): string => {
  const safe = String(raw).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48)
  return `${prefix}-${safe}`
}
