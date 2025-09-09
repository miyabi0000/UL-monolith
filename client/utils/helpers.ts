import { GearItemForm } from '../types';

/**
 * Client-side sanitization utilities
 * Note: Server-side validation is the authoritative source
 */

export function sanitizeGearForm(form: GearItemForm): GearItemForm {
  return {
    name: form.name.trim(),
    brand: form.brand?.trim() || undefined,
    productUrl: form.productUrl?.trim() || undefined,
    categoryId: form.categoryId?.trim() || undefined,
    requiredQuantity: Math.max(1, Math.min(10, form.requiredQuantity)),
    ownedQuantity: Math.max(0, Math.min(10, form.ownedQuantity)),
    weightGrams: form.weightGrams ? Math.max(0, form.weightGrams) : undefined,
    priceCents: form.priceCents ? Math.max(0, form.priceCents) : undefined,
    season: form.season?.trim() || undefined,
    priority: Math.max(1, Math.min(5, form.priority))
  };
}
