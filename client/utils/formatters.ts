/**
 * Format price in cents to display format
 * Automatically detects currency based on amount
 */
export const formatPrice = (priceCents?: number): string => {
  if (!priceCents) return '-'
  
  const price = priceCents / 100
  
  // Detect currency based on price range (simple heuristic)
  if (price > 1000) {
    // Assume JPY for larger numbers
    return `¥${Math.round(price).toLocaleString()}`
  } else {
    // Assume USD for smaller numbers
    return `$${price.toFixed(2)}`
  }
}

/**
 * Format weight in grams
 */
export const formatWeight = (weightGrams?: number): string => {
  if (!weightGrams) return '-'
  return `${weightGrams}g`
}

