import { z } from 'zod';
import { optionalText, requiredText } from '../primitives';

/**
 * PackInfoSection 用。
 * routeName は地名 or URL を許容（URL チェックはしない）。
 * description はサーバー sanitizeString と整合する 500 文字上限。
 */
export const packSchema = z.object({
  name: requiredText(80),
  routeName: optionalText(200),
  description: optionalText(500),
});

export type PackFormValues = z.infer<typeof packSchema>;
