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
 * カテゴリの基本色からアイテム用のグラデーション色を生成
 * @param baseColor カテゴリの基本色（HEX形式）
 * @param index アイテムのインデックス
 * @param total アイテムの総数
 * @returns HSL形式の色
 */
export const generateItemColor = (baseColor: string, index: number, total: number): string => {
  // HEXからRGBに変換
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // RGBからHSLに変換
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const diff = max - min

  let h = 0
  if (diff !== 0) {
    if (max === rNorm) h = ((gNorm - bNorm) / diff) % 6
    else if (max === gNorm) h = (bNorm - rNorm) / diff + 2
    else h = (rNorm - gNorm) / diff + 4
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360

  const l = (max + min) / 2
  const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1))

  // アイテムごとにグラデーションを適用
  const progress = index / total
  const newSaturation = Math.max(0.3, Math.min(0.9, s * (1 - progress * 0.7)))
  const newLightness = Math.max(0.4, Math.min(0.7, l + progress * 0.2))

  return `hsl(${h}, ${Math.round(newSaturation * 100)}%, ${Math.round(newLightness * 100)}%)`
}
