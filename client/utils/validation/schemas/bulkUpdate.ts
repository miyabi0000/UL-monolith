import { z } from 'zod';
import { VM } from '../messages';
import {
  nullableNumber,
  requiredIntFromString,
  requiredNumberFromString,
} from '../primitives';

/**
 * BulkActionModal の field × value を一括検証する discriminated union。
 *
 * UI からは value: string で渡る（select / number input の生値）。各 field
 * に応じて型を確定させる。weight/price は空送信を許容しないため
 * requiredNumberFromString を使う。
 */
export const bulkUpdateSchema = z.discriminatedUnion('field', [
  z.object({
    field: z.literal('category'),
    value: z.string().trim().min(1, VM.required),
  }),
  z.object({
    field: z.literal('priority'),
    value: requiredIntFromString(1, 5),
  }),
  z.object({
    field: z.literal('owned'),
    value: requiredIntFromString(0, 100),
  }),
  z.object({
    field: z.literal('required'),
    value: requiredIntFromString(1, 100),
  }),
  z.object({
    field: z.literal('weight'),
    // 数値（任意単位）として受け取り、UI 側で convertToGrams する
    value: requiredNumberFromString(0, 100_000),
  }),
  z.object({
    field: z.literal('price'),
    value: requiredIntFromString(0, 10_000_000),
  }),
  z.object({
    field: z.literal('seasons'),
    value: z
      .array(z.enum(['spring', 'summer', 'fall', 'winter']))
      .min(1, VM.selectAtLeast(1)),
  }),
]);

export type BulkUpdateFormValues = z.infer<typeof bulkUpdateSchema>;

/** 数量等で空欄も許容したいケース用（参考、現在は未使用） */
export const bulkUpdateNullableNumber = nullableNumber;
