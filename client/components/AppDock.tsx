import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface AppDockProps {
  onShowLogin: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  userName?: string;
  onShowChat?: () => void;
}

const AppDock: React.FC<AppDockProps> = ({
  onShowLogin,
  onLogout,
  isAuthenticated,
  userName,
  onShowChat,
}) => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.app-dock-user-menu')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [userMenuOpen]);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains('dark');
    if (nextDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    setIsDark(nextDark);
  };

  const userInitial = (userName?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="fixed top-3 right-3 z-[70] pointer-events-none">
      <div className="pointer-events-auto app-dock-user-menu relative flex items-center gap-1 rounded-lg shadow-sm bg-white px-1.5 py-1.5 dark:bg-gray-900">
        {location.pathname.startsWith('/p/') && (
          <a
            href="/"
            className="h-11 sm:h-9 px-2.5 sm:px-3 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 inline-flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden sm:inline">Board</span>
          </a>
        )}

        {onShowChat && (
          <button
            type="button"
            className="glass-header-chip h-11 sm:h-9 px-2.5 sm:px-3 inline-flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 text-xs font-medium"
            onClick={onShowChat}
            aria-label="Open chat (Add / Advisor)"
            title="Chat — add gear & advisor"
          >
            <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="hidden sm:inline">Chat</span>
          </button>
        )}

        <button
          type="button"
          className="glass-header-chip h-11 w-11 sm:h-9 sm:w-9 inline-flex items-center justify-center text-gray-600 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
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

        {/* 未ログイン: Login ボタンを直接表示
         * ログイン済み: avatar → dropdown (userName + Logout のみ) */}
        {!isAuthenticated ? (
          <button
            type="button"
            onClick={onShowLogin}
            className="glass-header-chip h-11 sm:h-9 px-2.5 sm:px-3 inline-flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-700"
            aria-label="Login"
            title="Login"
          >
            Login
          </button>
        ) : (
          <div className="hidden sm:block relative">
            <button
              type="button"
              className="glass-header-chip h-9 min-w-[36px] px-1.5 inline-flex items-center justify-center text-gray-600 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-label="User menu"
              title={userName || 'User'}
            >
              <span className="h-6 w-6 rounded-full bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 text-2xs font-semibold inline-flex items-center justify-center">
                {userInitial}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-md bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                {userName && (
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-300 border-b border-gray-200 truncate">
                    {userName}
                  </div>
                )}
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    onLogout();
                    setUserMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppDock;
