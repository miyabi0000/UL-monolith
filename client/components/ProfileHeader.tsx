import React from 'react';
import type { ProfileSettings } from '../hooks/useProfile';

interface ProfileHeaderProps {
  profile: ProfileSettings;
  onOpenSettings: () => void;
  onShowChat?: () => void;
}

/**
 * ProfileHeader — 画面上部のプロフィール表示 + 操作コントロール。
 *
 * アイコンは **Chat / Settings の 2 つ** に集約:
 * - Chat: bottom sheet 形式の ChatSidebar を開く
 * - Settings: tab モーダル (Profile / Account) を開く
 *
 * ダークモード切替は `ThemeToggleFab` (viewport 右上 fixed) に分離済み。
 * Profile 編集 / Logout は Settings モーダルに統合済み。
 */
const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onOpenSettings, onShowChat }) => {
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

        {/* 右: Chat + Settings の 2 アイコン */}
        <div className="flex items-center gap-1">
          {onShowChat && (
            <button
              type="button"
              onClick={onShowChat}
              className="icon-btn"
              aria-label="Open chat (Add / Advisor)"
              title="Chat — add gear & advisor"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="icon-btn"
            aria-label="Open settings"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default React.memo(ProfileHeader);
