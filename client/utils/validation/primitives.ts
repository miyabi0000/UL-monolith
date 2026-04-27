import { z } from 'zod';
import { VM } from './messages';

/**
 * zod スキーマの再利用部品。
 *
 * UL-monolith のフォームは「空文字 = 未入力 = undefined」とする方針。
 * 任意フィールドは optionalText / optionalHttpUrl のように
 * empty string を transform で undefined 化して扱う。
 */

/** 必須テキスト（trim 後 1 文字以上、上限 max 文字）。 */
export const requiredText = (max: number) =>
  z
    .string({ required_error: VM.required, invalid_type_error: VM.required })
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(1, VM.required)
        .max(max, VM.tooLong(max)),
    );

/** 任意テキスト。未入力 / 空文字 / null は undefined 化。trim 後の長さチェック。 */
export const optionalText = (max: number) =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((s) => (s == null ? '' : s.trim()))
    .pipe(z.string().max(max, VM.tooLong(max)))
    .transform((v) => (v === '' ? undefined : v));

/** 任意 http(s) URL。未入力 / 空文字 / null は undefined 化。 */
export const optionalHttpUrl = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((s) => (s == null ? '' : s.trim()))
  .superRefine((val, ctx) => {
    if (val === '') return;
    try {
      const u = new URL(val);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: VM.urlInvalid });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: VM.urlInvalid });
    }
  })
  .transform((v) => (v === '' ? undefined : v));

/**
 * 画像 URL — http(s) と data:image/* の両方を許容。
 * 上限 max 文字（base64 サイズチェックに利用）。未入力 / null は undefined 化。
 */
export const imageUrlOrDataUri = (max?: number) =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((s) => (s == null ? '' : s.trim()))
    .superRefine((val, ctx) => {
      if (val === '') return;
      if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(val)) {
        if (max !== undefined && val.length > max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: VM.imageTooLarge,
          });
        }
        return;
      }
      try {
        const u = new URL(val);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: VM.imageUrlInvalid,
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VM.imageUrlInvalid,
        });
      }
    })
    .transform((v) => (v === '' ? undefined : v));

/** 整数の範囲（必須）。NaN / 非整数 / 範囲外を弾く。 */
export const positiveInt = (min: number, max: number) =>
  z
    .number({ invalid_type_error: VM.positiveInt })
    .int(VM.positiveInt)
    .min(min, VM.numberMin(min))
    .max(max, VM.numberMax(max));

/**
 * 文字列/数値/空 をパースして number | null に正規化。
 * - 空文字 / null / undefined → null（フィールドクリアを許容）
 * - NaN / Infinity → エラー
 * - 範囲外 → エラー
 */
export const nullableNumber = (min: number, max: number) =>
  z
    .union([z.literal(''), z.string(), z.number(), z.null(), z.undefined()])
    .transform((v, ctx) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = typeof v === 'number' ? v : parseFloat(v);
      if (!Number.isFinite(n)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VM.finiteNumber,
        });
        return z.NEVER;
      }
      if (n < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VM.numberMin(min),
        });
        return z.NEVER;
      }
      if (n > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VM.numberMax(max),
        });
        return z.NEVER;
      }
      return n;
    });

/**
 * 文字列/数値 をパースして必須 number に正規化。BulkUpdateModal の value: string
 * のような UI 用に利用。範囲外/NaN はエラー。
 */
export const requiredNumberFromString = (min: number, max: number) =>
  z
    .union([z.string(), z.number()])
    .transform((v, ctx) => {
      const s = typeof v === 'string' ? v.trim() : String(v);
      if (s === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: VM.required });
        return z.NEVER;
      }
      const n = typeof v === 'number' ? v : parseFloat(s);
      if (!Number.isFinite(n)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VM.finiteNumber,
        });
        return z.NEVER;
      }
      if (n < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VM.numberMin(min),
        });
        return z.NEVER;
      }
      if (n > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VM.numberMax(max),
        });
        return z.NEVER;
      }
      return n;
    });

/** 整数版 requiredNumberFromString（priority, quantity 等の UI 用） */
export const requiredIntFromString = (min: number, max: number) =>
  requiredNumberFromString(min, max).pipe(z.number().int(VM.positiveInt));
