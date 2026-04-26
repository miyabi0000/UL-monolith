import { z } from 'zod';
import { VM } from '../messages';

/** Landing.tsx のメールサインアップ用 */
export const emailSchema = z.object({
  email: z
    .string({ required_error: VM.required })
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(1, VM.required)
        .max(254, VM.tooLong(254))
        .email(VM.email),
    ),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
