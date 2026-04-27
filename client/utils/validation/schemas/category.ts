import { z } from 'zod';
import { VM } from '../messages';
import { requiredText } from '../primitives';
import { JAPANESE_COLOR_HEX_SET } from '../../japaneseColors';

/**
 * CategoryManager 用。色は japaneseColors の許可一覧のみ。
 */
export const categorySchema = z.object({
  name: requiredText(50),
  color: z.string().refine(
    (v) => JAPANESE_COLOR_HEX_SET.has(v as Parameters<typeof JAPANESE_COLOR_HEX_SET.has>[0]),
    VM.paletteInvalid,
  ),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
