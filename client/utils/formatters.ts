export type Currency = 'JPY' | 'USD';

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
 * Format price with currency conversion
 * @param priceCents Price in cents (1/100 of a yen)
 * @param currency Currency to display (JPY or USD)
 * @returns Formatted price string
 */
export const formatPriceWithCurrency = (priceCents: number | null | undefined, currency: Currency = 'JPY'): string => {
  if (!priceCents) return '-';

  if (currency === 'USD') {
    // JPY → USD conversion (rate: 1 USD = 150 JPY)
    const usd = (priceCents / 100 / 150).toFixed(0);
    return `$${Number(usd).toLocaleString()}`;
  }

  // JPY
  const jpy = Math.round(priceCents / 100);
  return `¥${jpy.toLocaleString()}`;
};

/**
 * Calculate efficiency (weight per currency unit)
 * @param weightGrams Weight in grams
 * @param priceCents Price in cents
 * @param currency Currency for calculation
 * @returns Efficiency value as string (e.g., "0.50")
 */
export const calculateEfficiency = (
  weightGrams: number | null | undefined,
  priceCents: number | null | undefined,
  currency: Currency = 'JPY'
): string => {
  if (!weightGrams || !priceCents) return '-';

  if (currency === 'USD') {
    const usd = priceCents / 100 / 150;
    return (weightGrams / usd).toFixed(2);
  }

  const jpy = priceCents / 100;
  return (weightGrams / jpy).toFixed(2);
};

/**
 * Format weight in grams
 */
export const formatWeight = (weightGrams?: number): string => {
  if (!weightGrams) return '-'
  return `${weightGrams}g`
}

