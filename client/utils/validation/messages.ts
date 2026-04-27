/**
 * バリデーション共通メッセージ（英語統一）。
 * 各 zod スキーマと useFormValidation 経由のサーバー由来エラーで共通利用する。
 */
export const VM = {
  required: 'This field is required.',
  email: 'Please enter a valid email address.',
  urlInvalid: 'Please enter a valid URL (http:// or https://).',
  imageUrlInvalid: 'Please enter a valid image URL or upload a file.',
  imageTooLarge: 'Image is too large. Please choose one under 100KB.',
  handleInvalid:
    'Handle may contain only letters, numbers, dot, dash, and underscore.',
  paletteInvalid: 'Color must be selected from the Japanese color palette.',
  positiveInt: 'Must be a positive whole number.',
  finiteNumber: 'Please enter a valid number.',
  formInvalid: 'Please fix the errors below before continuing.',
  // 関数式は呼び出しごとに評価される（max 値が動的なため）
  tooShort: (n: number) => `Must be at least ${n} characters.`,
  tooLong: (n: number) => `Must be at most ${n} characters.`,
  numberMin: (n: number) => `Must be ${n} or greater.`,
  numberMax: (n: number) => `Must be ${n} or less.`,
  selectAtLeast: (n: number) => `Select at least ${n}.`,
} as const;
