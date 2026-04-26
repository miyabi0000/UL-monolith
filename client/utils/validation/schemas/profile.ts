import { z } from 'zod';
import { VM } from '../messages';
import { imageUrlOrDataUri, optionalText, requiredText } from '../primitives';

// useProfile.ts の MAX_IMAGE_BASE64_LENGTH と一致させる（base64 ≈ 100KB）
const MAX_IMAGE_BASE64_LENGTH = 137_000;

// handle: 先頭 @ 任意、英数 + . _ - のみ。空文字は requiredText で弾かれる
const HANDLE_RE = /^@?[A-Za-z0-9._-]+$/;

export const profileSchema = z.object({
  headerTitle: optionalText(40),
  headerImageUrl: imageUrlOrDataUri(MAX_IMAGE_BASE64_LENGTH),
  displayName: requiredText(50),
  handle: requiredText(30).pipe(
    z.string().regex(HANDLE_RE, VM.handleInvalid),
  ),
  bio: optionalText(280),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

/** 単一フィールド用に shape を再エクスポート（onBlur 検証で利用） */
export const profileFieldSchemas = profileSchema.shape;
