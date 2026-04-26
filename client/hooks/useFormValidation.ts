import { useCallback, useState } from 'react';
import { z } from 'zod';
import type { FieldErrors, ValidationResult } from '../utils/validation';

/**
 * 汎用バリデーションフック。
 *
 * - useState ベースのフォームに薄く差し込むことが目的
 * - zod スキーマを受け取り、`validate` と `validateField` を提供
 * - errors はインライン表示用、`_form` キーはサーバー由来エラー等のマップ不可エラー
 * - 通知（NotificationPopup）には依存しない。呼び出し側で showError する
 */
export interface UseFormValidationResult<T> {
  errors: FieldErrors<T>;
  /** フォーム全体を検証。成功時 errors を空に、失敗時 errors を更新し返す */
  validate: (values: unknown) => ValidationResult<T>;
  /** 単一フィールドを検証（onBlur 用）。成功時 errors[field] を消去 */
  validateField: <K extends keyof T & string>(
    field: K,
    value: unknown,
  ) => string | undefined;
  /** 任意フィールドのエラーを上書き / クリア（サーバーエラー反映用） */
  setFieldError: (field: keyof T | '_form', message: string | undefined) => void;
  /** 全エラーをクリア */
  clearErrors: () => void;
}

const toFieldErrors = <T,>(zerr: z.ZodError): FieldErrors<T> => {
  const out: FieldErrors<T> = {};
  for (const issue of zerr.issues) {
    const key = (issue.path[0] as keyof T | undefined) ?? '_form';
    // 同一フィールドは最初の issue のみ表示（メッセージ過多を避ける）
    if (out[key] === undefined) {
      out[key] = issue.message;
    }
  }
  return out;
};

export function useFormValidation<S extends z.ZodTypeAny>(
  schema: S,
): UseFormValidationResult<z.infer<S>> {
  type T = z.infer<S>;
  const [errors, setErrors] = useState<FieldErrors<T>>({});

  const validate = useCallback(
    (values: unknown): ValidationResult<T> => {
      const r = schema.safeParse(values);
      if (r.success) {
        setErrors({});
        return { ok: true, data: r.data as T };
      }
      const fe = toFieldErrors<T>(r.error);
      setErrors(fe);
      return { ok: false, errors: fe };
    },
    [schema],
  );

  const validateField = useCallback(
    <K extends keyof T & string>(field: K, value: unknown) => {
      // ZodObject の場合のみ shape からピックして部分検証
      const objSchema = schema as unknown as {
        shape?: Record<string, z.ZodTypeAny>;
      };
      const fieldSchema = objSchema.shape?.[field];
      if (!fieldSchema) return undefined;
      const r = fieldSchema.safeParse(value);
      if (r.success) {
        setErrors((prev) => {
          if (prev[field] === undefined) return prev;
          const next = { ...prev };
          delete next[field];
          return next;
        });
        return undefined;
      }
      const message = r.error.issues[0]?.message ?? 'Invalid value';
      setErrors((prev) => ({ ...prev, [field]: message }));
      return message;
    },
    [schema],
  );

  const setFieldError = useCallback(
    (field: keyof T | '_form', message: string | undefined) => {
      setErrors((prev) => {
        const next = { ...prev };
        if (message === undefined) {
          delete next[field];
        } else {
          next[field] = message;
        }
        return next;
      });
    },
    [],
  );

  const clearErrors = useCallback(() => setErrors({}), []);

  return { errors, validate, validateField, setFieldError, clearErrors };
}
