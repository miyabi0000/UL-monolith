import React, { useEffect } from 'react';
import type { ProfileSettings } from '../hooks/useProfile';
import { useImageUpload } from '../hooks/useImageUpload';

interface ProfileEditorModalProps {
  profile: ProfileSettings;
  onUpdate: <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => void;
  onClose: () => void;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{children}</label>
);

/** ギア入力と同じドラッグ&ドロップ画像選択UI（コンパクト版） */
const ImageDropZone: React.FC<{
  imageUrl: string;
  onSelect: (base64: string) => void;
  onRemove: () => void;
  inputId: string;
  height?: string;
}> = ({ imageUrl, onSelect, onRemove, inputId, height = 'max-h-24' }) => {
  const { isDragging, imagePreview, handleDragOver, handleDragLeave, handleDrop, handleImageSelect, setPreview, removeImage } = useImageUpload();

  // 既存画像をプレビューに反映
  useEffect(() => {
    setPreview(imageUrl || null);
  }, [imageUrl]);

  const preview = imagePreview || imageUrl;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, onSelect)}
      className={`border-2 border-dashed rounded-md p-2 text-center transition-colors ${
        isDragging ? 'border-gray-700 bg-gray-50 dark:bg-slate-700' : 'border-gray-300 dark:border-slate-600'
      }`}
    >
      {preview ? (
        <div className="relative">
          <img src={preview} alt="" className={`${height} w-full object-cover rounded`} />
          <button
            type="button"
            onClick={() => removeImage(onRemove)}
            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] inline-flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="py-1">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            Drag & drop or click to select
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
            className="btn-secondary text-[11px] px-3 py-1 rounded cursor-pointer"
          >
            Choose Image
          </label>
        </div>
      )}
    </div>
  );
};

const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({ profile, onUpdate, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-panel-lg" onClick={(e) => e.stopPropagation()}>
      <div className="px-4 py-3 neu-divider flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Edit Profile</h3>
        <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
      </div>
      <div className="px-4 py-3 space-y-3">
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
        <div className="flex items-center justify-end pt-1">
          <button type="button" className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  </div>
);

export default React.memo(ProfileEditorModal);
