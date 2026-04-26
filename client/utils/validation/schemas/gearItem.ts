import { z } from 'zod';
import {
  imageUrlOrDataUri,
  nullableNumber,
  optionalHttpUrl,
  optionalText,
  positiveInt,
  requiredText,
} from '../primitives';

/**
 * GearItem フォーム / Editable* 系用スキーマ。
 * サーバー `server/utils/validation.ts` の sanitizeGearForm の上限値と整合させる:
 *   - name 1-120
 *   - brand 0-80
 *   - quantity 1-100 / 0-100
 *   - weight 0-10000g
 *   - price 0-10,000,000 銭
 *   - priority 1-5
 */
export const gearItemSchema = z.object({
  name: requiredText(120),
  brand: optionalText(80),
  productUrl: optionalHttpUrl,
  // base64 画像も入りうるので上限緩め（サーバー側で再検査）
  imageUrl: imageUrlOrDataUri(),
  categoryId: z.string().min(1).optional(),
  requiredQuantity: positiveInt(1, 100),
  ownedQuantity: positiveInt(0, 100),
  weightGrams: nullableNumber(0, 10_000),
  weightClass: z.enum(['base', 'worn', 'consumable']),
  weightConfidence: z.enum(['high', 'med', 'low']),
  weightSource: z.enum(['manual', 'jsonld', 'og', 'html', 'llm']),
  priceCents: nullableNumber(0, 10_000_000),
  seasons: z
    .array(z.enum(['spring', 'summer', 'fall', 'winter']))
    .optional(),
  priority: positiveInt(1, 5),
  isInKit: z.boolean(),
});

export type GearItemFormValues = z.infer<typeof gearItemSchema>;

/**
 * Editable* 系の単一フィールド用スキーマ。
 * shape からは外れた専用スキーマを定義することで、Editable 系の
 * onBlur で局所的に検証可能。
 */
export const gearTextFieldSchemas = {
  name: gearItemSchema.shape.name,
  brand: gearItemSchema.shape.brand,
  productUrl: gearItemSchema.shape.productUrl,
} as const;

export const gearWeightFieldSchema = gearItemSchema.shape.weightGrams;
export const gearPriceFieldSchema = gearItemSchema.shape.priceCents;
