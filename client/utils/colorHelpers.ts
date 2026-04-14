/**
 * Color manipulation utilities for UL Gear Manager
 * Extracted from GearChart for reusability across components
 */

/**
 * HEX形式の色を暗くする
 * @param color HEX形式の色（例: #FF6B6B）
 * @param amount 暗くする割合（0-1）
 * @returns 暗くされたHEX色
 */
export const darkenColor = (color: string, amount: number = 0.2): string => {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  const newR = Math.max(0, Math.floor(r * (1 - amount)))
  const newG = Math.max(0, Math.floor(g * (1 - amount)))
  const newB = Math.max(0, Math.floor(b * (1 - amount)))

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

/**
 * HSL形式の色を暗くする
 * @param hslColor HSL形式の色（例: hsl(120, 50%, 60%)）
 * @param amount 暗くする割合（0-1）
 * @returns 暗くされたHSL色
 */
export const darkenHslColor = (hslColor: string, amount: number = 0.2): string => {
  const hslMatch = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!hslMatch) return hslColor

  const h = parseInt(hslMatch[1])
  const s = parseInt(hslMatch[2])
  const l = parseInt(hslMatch[3])

  const newL = Math.max(0, Math.floor(l * (1 - amount)))

  return `hsl(${h}, ${s}%, ${newL}%)`
}

/**
 * アイテム用のグレースケール色を生成 (Mondrian Matte 配色)
 * カテゴリ色 (baseColor) は無視し、index/total から濃淡を決める。
 * 最も大きいアイテム (index=0) が濃く、小さいものが薄くなる。
 *
 * @param _baseColor 互換のため受け取るが使用しない
 * @param index アイテムのインデックス
 * @param total アイテムの総数
 * @returns HSL grayscale 形式の色 (lightness 25% → 70%)
 */
export const generateItemColor = (_baseColor: string, index: number, total: number): string => {
  const denom = Math.max(1, total - 1)
  const lightness = 25 + (index / denom) * 45 // 25% (濃) → 70% (薄)
  return `hsl(0, 0%, ${Math.round(lightness)}%)`
}
