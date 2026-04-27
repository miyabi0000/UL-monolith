import { z } from 'zod';
import { imageUrlOrDataUri } from '../primitives';

/**
 * ImageEditModal の URL/data: 入力。
 * gear 側は base64 上限を別途設けない（サーバーが圧縮済みを期待）。
 */
export const imageInputSchema = z.object({
  imageUrl: imageUrlOrDataUri(),
});

export type ImageInputValues = z.infer<typeof imageInputSchema>;
