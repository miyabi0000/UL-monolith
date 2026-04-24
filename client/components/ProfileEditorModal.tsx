import React, { useEffect, useState } from 'react';
import type { ProfileSettings, UserPlan } from '../hooks/useProfile';
import { useImageUpload } from '../hooks/useImageUpload';
import { createCheckoutSession, createPortalSession } from '../services/billingService';

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{children}</label>
);

const PlanSection: React.FC<{ plan: UserPlan }> = ({ plan }) => {
  const [loading, setLoading] = useState(false);

  const goTo = async (getUrl: () => Promise<string>, errorMessage: string) => {
    setLoading(true);
    try {
      window.location.href = await getUrl();
    } catch (err) {
      console.error('[Billing]', err);
      alert(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <SectionLabel>Plan</SectionLabel>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">
          現在のプラン: <strong>{plan === 'pro' ? 'Pro' : 'Free'}</strong>
        </span>
        {plan === 'free' ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => goTo(createCheckoutSession, '決済ページを開けませんでした。時間をおいて再試行してください。')}
            disabled={loading}
          >
            {loading ? '読込中...' : 'Upgrade to Pro'}
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => goTo(createPortalSession, 'サブスクリプション管理ページを開けませんでした。')}
            disabled={loading}
          >
            {loading ? '読込中...' : 'Manage'}
          </button>
        )}
      </div>
    </div>
  );
};

/** ギア入力と同じドラッグ&ドロップ画像選択UI（コンパクト版） */
const ImageDropZone: React.FC<{
  imageUrl: string;
  onSelect: (base64: string) => void;
  onRemove: () => void;
  inputId: string;
  height?: string;
}> = ({ imageUrl, onSelect, onRemove, inputId, height = 'max-h-24' }) => {
  const { isDragging, imagePreview, handleDragOver, handleDragLeave, handleDrop, handleImageSelect, setPreview, removeImage } = useImageUpload();

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
        isDragging ? 'border-gray-700 bg-gray-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      {preview ? (
        <div className="relative">
          <img src={preview} alt="" className={`${height} w-full object-cover rounded`} />
          <button
            type="button"
            onClick={() => removeImage(onRemove)}
            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-2xs inline-flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="py-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
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
            className="btn-secondary text-xs px-3 py-1 rounded cursor-pointer"
          >
            Choose Image
          </label>
        </div>
      )}
    </div>
  );
};

// ==================== Form (再利用可能な中身のみ) ====================

interface ProfileEditorFormProps {
  profile: ProfileSettings;
  onUpdate: <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => void;
  plan?: UserPlan;
}

/**
 * プロフィール編集フォーム本体 (モーダル chrome なし)。
 * 単体モーダル (`ProfileEditorModal`) と統合 Settings (`SettingsModal`) の
 * 両方から再利用される。
 */
export const ProfileEditorForm: React.FC<ProfileEditorFormProps> = ({ profile, onUpdate, plan = 'free' }) => (
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
    <PlanSection plan={plan} />
  </div>
);

// ==================== Modal wrapper (後方互換) ====================

interface ProfileEditorModalProps {
  profile: ProfileSettings;
  onUpdate: <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => void;
  onClose: () => void;
  plan?: UserPlan;
}

const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({ profile, onUpdate, onClose, plan = 'free' }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-panel-lg" onClick={(e) => e.stopPropagation()}>
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Edit Profile</h3>
        <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
      </div>
      <div className="px-4 py-3">
        <ProfileEditorForm profile={profile} onUpdate={onUpdate} plan={plan} />
        <div className="flex items-center justify-end pt-3">
          <button type="button" className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  </div>
);

export default React.memo(ProfileEditorModal);
