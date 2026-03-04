import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

interface AppHeaderProps {
  onShowLogin: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onShowLogin,
  onLogout,
  isAuthenticated,
  userName
}) => {
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 初期状態の読み込み
  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark');
    setIsDark(dark);
  }, []);

  // ダークモード切り替え
  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  // メニューを閉じる（クリックアウトサイド）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <header className="bg-gray-50/60 dark:bg-slate-900/40 transition-colors duration-200">
      {/* Wrapper with reduced padding */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-4 py-2">
        {/* Compact island container */}
        <div className="glass-surface glass-refract glass-header flex items-center justify-between gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-1.5 transition-colors duration-200">
          {/* Left: Logo + Primary Tabs */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-normal lowercase text-xs sm:text-sm text-gray-900 dark:text-gray-100 tracking-wide whitespace-nowrap">
              minimal gear manager
            </h1>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  [
                    'h-7 px-2.5 rounded-full text-xs font-medium transition-colors inline-flex items-center',
                    isActive
                      ? 'bg-white/75 dark:bg-slate-700/70 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-700/40'
                  ].join(' ')
                }
              >
                ALL
              </NavLink>
              <NavLink
                to="/packs"
                className={({ isActive }) =>
                  [
                    'h-7 px-2.5 rounded-full text-xs font-medium transition-colors inline-flex items-center',
                    isActive
                      ? 'bg-white/75 dark:bg-slate-700/70 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-700/40'
                  ].join(' ')
                }
              >
                Packs
              </NavLink>
            </nav>
          </div>

          {/* Right: Main actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Dark mode toggle */}
            <button
              className="glass-header-chip p-1.5 text-gray-600 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700/50"
              onClick={toggleDarkMode}
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

            {/* User menu */}
            <div className="relative user-menu-container">
              <button
                className="glass-header-chip p-1.5 text-gray-600 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700/50"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <div className="glass-surface glass-refract glass-header absolute right-0 mt-2 w-40 rounded-lg py-1 z-50">
                  {isAuthenticated ? (
                    <>
                      {userName && (
                        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-slate-600">
                          {userName}
                        </div>
                      )}
                      <button
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => {
                          onLogout();
                          setUserMenuOpen(false);
                        }}
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        onShowLogin();
                        setUserMenuOpen(false);
                      }}
                    >
                      Login
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
