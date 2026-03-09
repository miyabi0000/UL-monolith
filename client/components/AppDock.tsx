import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface AppDockProps {
  onShowLogin: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

const AppDock: React.FC<AppDockProps> = ({
  onShowLogin,
  onLogout,
  isAuthenticated,
  userName
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
    const onClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.app-dock-user-menu')) {
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
      <div className="pointer-events-auto app-dock-user-menu relative flex items-center gap-1 rounded-2xl border border-gray-200/70 bg-white/78 px-1.5 py-1.5 shadow-lg backdrop-blur dark:border-slate-600/90 dark:bg-slate-900/72">
        {location.pathname.startsWith('/p/') && (
          <a
            href="/"
            className="h-9 px-3 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-white/55 dark:hover:bg-slate-700/50 inline-flex items-center transition-colors"
          >
            Board
          </a>
        )}

        <button
          type="button"
          className="glass-header-chip h-9 w-9 inline-flex items-center justify-center text-gray-600 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700/60"
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

        <button
          type="button"
          className="glass-header-chip h-9 min-w-[36px] px-1.5 inline-flex items-center justify-center text-gray-600 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700/60"
          onClick={() => setUserMenuOpen((prev) => !prev)}
          aria-label="User menu"
        >
          {isAuthenticated ? (
            <span className="h-6 w-6 rounded-full bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 text-[10px] font-semibold inline-flex items-center justify-center">
              {userInitial}
            </span>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-lg overflow-hidden">
            {isAuthenticated ? (
              <>
                {userName && (
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-slate-600 truncate">
                    {userName}
                  </div>
                )}
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
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
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
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
  );
};

export default AppDock;
