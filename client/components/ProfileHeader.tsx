import React, { useEffect, useState } from 'react';
import type { ProfileSettings } from '../hooks/useProfile';

interface ProfileHeaderProps {
  profile: ProfileSettings;
  onEditProfile: () => void;
  // AppDock から移植するコントロール
  isAuthenticated: boolean;
  userName?: string;
  onShowLogin: () => void;
  onLogout: () => void;
  onShowChat?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onEditProfile,
  isAuthenticated,
  userName,
  onShowLogin,
  onLogout,
  onShowChat,
}) => {
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.profile-user-menu')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    const next = !root.classList.contains('dark');
    root.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  const userInitial = (userName?.trim()?.charAt(0) || 'U').toUpperCase();

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
              <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* 右: コントロール群
         * - Chat / Edit Profile / Dark mode は常時表示
         * - 未ログイン時: Login ボタンを直接表示（メニューに埋め込まない）
         * - ログイン済み: avatar → User menu（userName + Logout のみ） */}
        <div className="profile-user-menu relative flex items-center gap-1">
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
            onClick={onEditProfile}
            className="icon-btn"
            aria-label="Edit Profile"
            title="Edit Profile"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="icon-btn"
            aria-label="Toggle dark mode"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {!isAuthenticated ? (
            <button
              type="button"
              onClick={onShowLogin}
              className="icon-btn"
              aria-label="Login"
              title="Login"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setUserMenuOpen((p) => !p)}
                className="icon-btn"
                aria-label="User menu"
                title={userName || 'User'}
              >
                <span className="h-5 w-5 rounded-full bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 text-2xs font-semibold inline-flex items-center justify-center">
                  {userInitial}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-md bg-white dark:bg-gray-800 shadow-sm overflow-hidden z-50">
                  {userName && (
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 truncate">
                      {userName}
                    </div>
                  )}
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => { onLogout(); setUserMenuOpen(false); }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(ProfileHeader);
