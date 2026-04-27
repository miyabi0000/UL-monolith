import { z } from 'zod';
import { VM } from '../messages';

/** FloatingChatInput / Advisor — 軽い長さ検証のみ */
export const chatMessageSchema = z.object({
  text: z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(1, VM.required)
        .max(2000, VM.tooLong(2000)),
    ),
});

export type ChatMessageValues = z.infer<typeof chatMessageSchema>;
