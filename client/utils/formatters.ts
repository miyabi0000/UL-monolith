/**
 * Format price in cents to JPY display format
 * @param priceCents Price in cents (1/100 of a yen)
 * @returns Formatted price string (e.g., "¥12,345")
 */
export const formatPrice = (priceCents?: number): string => {
  if (!priceCents) return '-'
  const price = priceCents / 100
  return `¥${Math.round(price).toLocaleString()}`
}

/**
 * Format weight in grams
 */
export const formatWeight = (weightGrams?: number): string => {
  if (!weightGrams) return '-'
  return `${weightGrams}g`
}

