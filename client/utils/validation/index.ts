/**
 * バリデーションモジュールの公開 API。
 * フォームコンポーネント側は基本的に schemas/* と useFormValidation のみを参照する。
 */
export { VM } from './messages';
export type { FieldErrors, ValidationResult } from './types';

export {
  requiredText,
  optionalText,
  optionalHttpUrl,
  imageUrlOrDataUri,
  positiveInt,
  nullableNumber,
  requiredNumberFromString,
  requiredIntFromString,
} from './primitives';

export { emailSchema } from './schemas/auth';
export type { EmailFormValues } from './schemas/auth';

export {
  profileSchema,
  profileFieldSchemas,
} from './schemas/profile';
export type { ProfileFormValues } from './schemas/profile';

export { packSchema } from './schemas/pack';
export type { PackFormValues } from './schemas/pack';

export { categorySchema } from './schemas/category';
export type { CategoryFormValues } from './schemas/category';

export {
  gearItemSchema,
  gearTextFieldSchemas,
  gearWeightFieldSchema,
  gearPriceFieldSchema,
} from './schemas/gearItem';
export type { GearItemFormValues } from './schemas/gearItem';

export { bulkUpdateSchema } from './schemas/bulkUpdate';
export type { BulkUpdateFormValues } from './schemas/bulkUpdate';

export { imageInputSchema } from './schemas/image';
export type { ImageInputValues } from './schemas/image';

export { chatMessageSchema } from './schemas/chat';
export type { ChatMessageValues } from './schemas/chat';
