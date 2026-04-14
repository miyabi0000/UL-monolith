import { GearItemForm, GearItem, DEFAULT_GEAR_VALUES } from '../models/types.js';

// リクエストボディの型（any入力を受け付ける）
interface RawGearInput {
  name?: string;
  brand?: string;
  productUrl?: string;
  imageUrl?: string;
  categoryId?: string;
  requiredQuantity?: string | number;
  ownedQuantity?: string | number;
  weightGrams?: string | number;
  weightClass?: string;
  weightConfidence?: string;
  weightSource?: string;
  priceCents?: string | number;
  seasons?: string[];
  priority?: string | number;
  isInKit?: boolean;
}

/**
 * ギアデータをサニタイズしてGearItemForm形式に変換
 */
export const sanitizeGearData = (data: RawGearInput): GearItemForm => {
  return {
    name: data.name?.trim() || '',
    brand: data.brand?.trim() || undefined,
    productUrl: data.productUrl?.trim() || undefined,
    imageUrl: data.imageUrl?.trim() || undefined,
    categoryId: data.categoryId?.trim() || undefined,
    requiredQuantity: Math.max(1, Math.min(10, parseInt(String(data.requiredQuantity)) || DEFAULT_GEAR_VALUES.requiredQuantity)),
    ownedQuantity: Math.max(0, Math.min(10, parseInt(String(data.ownedQuantity)) || DEFAULT_GEAR_VALUES.ownedQuantity)),
    weightGrams: data.weightGrams ? Math.max(0, parseInt(String(data.weightGrams))) : undefined,
    weightClass: (['base', 'worn', 'consumable'].includes(data.weightClass || '')
      ? data.weightClass as 'base' | 'worn' | 'consumable'
      : DEFAULT_GEAR_VALUES.weightClass),
    weightConfidence: (['high', 'med', 'low'].includes(data.weightConfidence || '')
      ? data.weightConfidence as 'high' | 'med' | 'low'
      : DEFAULT_GEAR_VALUES.weightConfidence),
    weightSource: (['manual', 'jsonld', 'og', 'html', 'llm'].includes(data.weightSource || '')
      ? data.weightSource as 'manual' | 'jsonld' | 'og' | 'html' | 'llm'
      : DEFAULT_GEAR_VALUES.weightSource),
    priceCents: data.priceCents ? Math.max(0, parseInt(String(data.priceCents))) : undefined,
    seasons: data.seasons?.filter((s): s is 'spring' | 'summer' | 'fall' | 'winter' =>
      ['spring', 'summer', 'fall', 'winter'].includes(s)
    ),
    priority: Math.max(1, Math.min(5, parseInt(String(data.priority)) || DEFAULT_GEAR_VALUES.priority)),
    isInKit: data.isInKit ?? DEFAULT_GEAR_VALUES.isInKit
  };
};

/**
 * ギアアイテムに計算フィールドを追加
 */
export const calculateGearFields = (item: GearItem) => {
  const requiredQuantity = item.requiredQuantity || 1;
  const ownedQuantity = item.ownedQuantity || 0;
  const weightGrams = item.weightGrams || 0;
  const priceCents = item.priceCents || 0;

  return {
    ...item,
    shortage: requiredQuantity - ownedQuantity,
    totalWeight: weightGrams * requiredQuantity,
    totalPrice: priceCents * requiredQuantity,
    missingQuantity: Math.max(0, requiredQuantity - ownedQuantity)
  };
};
