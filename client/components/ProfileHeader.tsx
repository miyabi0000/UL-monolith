import React from 'react';
import type { ProfileSettings } from '../hooks/useProfile';

interface ProfileHeaderProps {
  profile: ProfileSettings;
  onOpenSettings: () => void;
}

/**
 * ProfileHeader — 画面上部のプロフィール表示 + 操作コントロール。
 *
 * Chat の起点は画面下のガラス型 FloatingChatInput に集約済み。
 * ここに残すアイコンは **Settings の 1 つのみ**。
 * (ダークモード切替は `ThemeToggleFab`、Profile / Logout は Settings モーダル)
 */
const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onOpenSettings }) => {
  return (
    <section className="card overflow-hidden">
      {profile.headerImageUrl && (
        <div className="h-24 sm:h-32 w-full bg-gray-100 dark:bg-gray-700">
          <img src={profile.headerImageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="px-3 py-2 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* 左: プロフィール情報 */}
        <div className="min-w-0 flex items-center gap-3" style={{ minHeight: 'var(--control-h)' }}>
          <span
            className="bg-mondrian-black text-mondrian-canvas dark:bg-mondrian-canvas dark:text-mondrian-black text-sm font-semibold inline-flex items-center justify-center shrink-0"
            style={{ height: 'var(--control-h)', width: 'var(--control-h)', borderRadius: 'var(--radius-control)' }}
          >
            {(profile.displayName?.trim()?.charAt(0) || 'U').toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-2xs uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">{profile.headerTitle}</p>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{profile.displayName}</h2>
            {profile.bio && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[240px] sm:max-w-xs">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* 右: Settings の 1 アイコン (Chat は FloatingChatInput に集約) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSettings}
            className="icon-btn"
            aria-label="Open settings"
            title="More"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="5"  r="1.4" fill="currentColor" />
              <circle cx="12" cy="12" r="1.4" fill="currentColor" />
              <circle cx="12" cy="19" r="1.4" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default React.memo(ProfileHeader);
