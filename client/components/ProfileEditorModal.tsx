import React, { useEffect } from 'react';
import type { ProfileSettings } from '../hooks/useProfile';
import { useImageUpload } from '../hooks/useImageUpload';

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

export const ProfileEditorForm: React.FC<ProfileEditorFormProps> = ({ profile, onUpdate }) => (
  <div className="space-y-3">
    <div className="space-y-1.5">
      <SectionLabel>Header</SectionLabel>
      <input
        className="input w-full"
        placeholder="Packboard"
        value={profile.headerTitle}
        onChange={(e) => onUpdate('headerTitle', e.target.value)}
      />
      <ImageDropZone
        imageUrl={profile.headerImageUrl}
        onSelect={(base64) => onUpdate('headerImageUrl', base64)}
        onRemove={() => onUpdate('headerImageUrl', '')}
        inputId="profile-header-image"
        height="max-h-20"
      />
    </div>
    <div className="space-y-1.5">
      <SectionLabel>Profile</SectionLabel>
      <input
        className="input w-full"
        placeholder="Display name"
        value={profile.displayName}
        onChange={(e) => onUpdate('displayName', e.target.value)}
      />
      <input
        className="input w-full"
        placeholder="@handle"
        value={profile.handle}
        onChange={(e) => onUpdate('handle', e.target.value)}
      />
      <textarea
        className="input w-full min-h-[64px]"
        placeholder="Bio"
        value={profile.bio}
        onChange={(e) => onUpdate('bio', e.target.value)}
      />
    </div>
  </div>
);
