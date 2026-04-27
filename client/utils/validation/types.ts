/**
 * バリデーションの共通型。
 *
 * - FieldErrors: フィールド名 → エラーメッセージ。`_form` はフォーム全体のエラー
 *   （サーバー由来エラー等、特定フィールドにマップできないもの）
 */
export type FieldErrors<T> = Partial<Record<keyof T | '_form', string>>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors<T> };
