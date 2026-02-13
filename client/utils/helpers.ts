import { GearItemForm, DEFAULT_GEAR_VALUES } from './types';

/**
 * Client-side sanitization utilities
 * Note: Server-side validation is the authoritative source
 */

export function sanitizeGearForm(form: GearItemForm): GearItemForm {
  return {
    name: form.name.trim(),
    brand: form.brand?.trim() || undefined,
    productUrl: form.productUrl?.trim() || undefined,
    imageUrl: form.imageUrl?.trim() || undefined,
    categoryId: form.categoryId?.trim() || undefined,
    requiredQuantity: Math.max(1, Math.min(10, form.requiredQuantity)),
    ownedQuantity: Math.max(0, Math.min(10, form.ownedQuantity)),
    weightClass: form.weightClass || DEFAULT_GEAR_VALUES.weightClass,
    weightGrams: form.weightGrams ? Math.max(0, form.weightGrams) : undefined,
    weightConfidence: form.weightConfidence || DEFAULT_GEAR_VALUES.weightConfidence,
    weightSource: form.weightSource || DEFAULT_GEAR_VALUES.weightSource,
    priceCents: form.priceCents ? Math.max(0, form.priceCents) : undefined,
    season: form.season?.trim() || undefined,
    priority: Math.max(1, Math.min(5, form.priority)),
    isInKit: form.isInKit ?? DEFAULT_GEAR_VALUES.isInKit
  };
}
