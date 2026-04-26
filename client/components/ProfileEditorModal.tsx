import React, { useEffect } from 'react';
import type { ProfileSettings } from '../hooks/useProfile';
import { useImageUpload } from '../hooks/useImageUpload';
import { useFormValidation } from '../hooks/useFormValidation';
import { profileSchema } from '../utils/validation';
import { FieldError } from './ui/FieldError';

/**
 * Profile 編集フォーム本体（モーダル chrome なし）。
 *
 * - 単独モーダルは廃止し、Settings モーダルの Profile タブから直接利用される。
 * - Plan / 課金 UI は Settings モーダルの Plan タブに分離済みのため、ここでは扱わない。
 * - 全ての色はデザイントークン (`--ink-*`, `--stroke-*`, `--surface-*`) に統一。
 *   `dark:` プレフィックスのハードコードは使わない。
 */

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label
    className="text-xs uppercase tracking-wide"
    style={{ color: 'var(--ink-muted)' }}
  >
    {children}
  </label>
);

/** ギア入力と同じドラッグ&ドロップ画像選択UI（コンパクト版） */
const ImageDropZone: React.FC<{
  imageUrl: string;
  onSelect: (base64: string) => void;
  onRemove: () => void;
  inputId: string;
  height?: string;
}> = ({ imageUrl, onSelect, onRemove, inputId, height = 'max-h-24' }) => {
  const {
    isDragging,
    imagePreview,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleImageSelect,
    setPreview,
    removeImage,
  } = useImageUpload();

  useEffect(() => {
    setPreview(imageUrl || null);
  }, [imageUrl]);

  const preview = imagePreview || imageUrl;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, onSelect)}
      className="border-2 border-dashed rounded-control p-2 text-center transition-colors"
      style={{
        borderColor: isDragging ? 'var(--ink-primary)' : 'var(--stroke-subtle)',
        background: isDragging ? 'var(--surface-level-1)' : 'transparent',
      }}
    >
      {preview ? (
        <div className="relative">
          <img src={preview} alt="" className={`${height} w-full object-cover rounded-control`} />
          <button
            type="button"
            onClick={() => removeImage(onRemove)}
            aria-label="Remove image"
            className="absolute top-1 right-1 h-5 w-5 rounded-full text-2xs inline-flex items-center justify-center"
            style={{ background: 'var(--mondrian-red)', color: 'var(--ink-inverse)' }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="py-1">
          <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
            Drag &amp; drop or click to select
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageSelect(e, onSelect)}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className="btn-secondary btn-xs cursor-pointer"
          >
            Choose Image
          </label>
        </div>
      )}
    </div>
  );
};

interface ProfileEditorFormProps {
  profile: ProfileSettings;
  onUpdate: <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => void;
}

export const ProfileEditorForm: React.FC<ProfileEditorFormProps> = ({ profile, onUpdate }) => {
  // autosave 構成のため onChange 時は親の onUpdate にそのまま流し、
  // インライン validation は onBlur のタイミングで実行する
  const { errors, validateField, setFieldError } = useFormValidation(profileSchema);

  const handleImageSelect = (base64: string) => {
    onUpdate('headerImageUrl', base64);
    // 画像選択時に同期検証（100KB 制約）
    validateField('headerImageUrl', base64);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <SectionLabel>Header</SectionLabel>
        <input
          className={`input w-full ${errors.headerTitle ? 'input-error' : ''}`}
          placeholder="Packboard"
          value={profile.headerTitle}
          onChange={(e) => onUpdate('headerTitle', e.target.value)}
          onBlur={(e) => validateField('headerTitle', e.target.value)}
          maxLength={40}
          aria-invalid={errors.headerTitle ? true : undefined}
        />
        <FieldError message={errors.headerTitle} />
        <ImageDropZone
          imageUrl={profile.headerImageUrl}
          onSelect={handleImageSelect}
          onRemove={() => {
            onUpdate('headerImageUrl', '');
            setFieldError('headerImageUrl', undefined);
          }}
          inputId="profile-header-image"
          height="max-h-20"
        />
        <FieldError message={errors.headerImageUrl} />
      </div>
      <div className="space-y-1.5">
        <SectionLabel>Profile</SectionLabel>
        <input
          className={`input w-full ${errors.displayName ? 'input-error' : ''}`}
          placeholder="Display name"
          value={profile.displayName}
          onChange={(e) => onUpdate('displayName', e.target.value)}
          onBlur={(e) => validateField('displayName', e.target.value)}
          maxLength={50}
          aria-invalid={errors.displayName ? true : undefined}
        />
        <FieldError message={errors.displayName} />
        <input
          className={`input w-full ${errors.handle ? 'input-error' : ''}`}
          placeholder="@handle"
          value={profile.handle}
          onChange={(e) => onUpdate('handle', e.target.value)}
          onBlur={(e) => validateField('handle', e.target.value)}
          maxLength={30}
          aria-invalid={errors.handle ? true : undefined}
        />
        <FieldError message={errors.handle} />
        <textarea
          className={`input w-full min-h-[64px] ${errors.bio ? 'input-error' : ''}`}
          placeholder="Bio"
          value={profile.bio}
          onChange={(e) => onUpdate('bio', e.target.value)}
          onBlur={(e) => validateField('bio', e.target.value)}
          maxLength={280}
          aria-invalid={errors.bio ? true : undefined}
        />
        <FieldError message={errors.bio} />
      </div>
    </div>
  );
};
