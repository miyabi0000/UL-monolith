import React, { useEffect, useState } from 'react';

interface AppHeaderProps {
  onShowLogin: () => void;
  onLogout: () => void;
  onToggleChat: () => void;
  onShowCategoryManager?: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onShowLogin,
  onLogout,
  onToggleChat,
  onShowCategoryManager,
  isAuthenticated,
  userName
}) => {
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      if (menuOpen && !(event.target as Element).closest('.menu-container')) {
        setMenuOpen(false);
      }
      if (userMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, userMenuOpen]);

  return (
    <header className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Wrapper with reduced padding */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-4 py-2">
        {/* Compact island container */}
        <div className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 shadow-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-1.5 transition-colors duration-200">
          {/* Left: Logo */}
          <h1 className="font-normal lowercase text-xs sm:text-sm text-gray-900 dark:text-gray-100 tracking-wide whitespace-nowrap">
            minimal gear manager
          </h1>

          {/* Right: Main actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Hamburger menu for secondary actions */}
            <div className="relative menu-container">
              <button
                className="p-1.5 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-150"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {onShowCategoryManager && (
                    <button
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        onShowCategoryManager();
                        setMenuOpen(false);
                      }}
                    >
                      Categories
                    </button>
                  )}
                  <button
                    className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      onToggleChat();
                      setMenuOpen(false);
                    }}
                  >
                    AI Assistant
                  </button>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              className="p-1.5 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-150"
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
                className="p-1.5 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-150"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {isAuthenticated ? (
                    <>
                      {userName && (
                        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          {userName}
                        </div>
                      )}
                      <button
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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