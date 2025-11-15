import React, { useEffect, useState } from 'react';

interface AppHeaderProps {
  onShowLogin: () => void;
  onLogout: () => void;
  onToggleChat: () => void;
  onShowCategoryManager?: () => void;
  onNavigateToComparison?: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onShowLogin,
  onLogout,
  onToggleChat,
  onShowCategoryManager,
  onNavigateToComparison,
  isAuthenticated,
  userName
}) => {
  const [isDark, setIsDark] = useState(false);

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

  return (
    <header className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Wrapper with same structure as main */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-4 py-4">
        {/* アイランド型コンテナ */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 bg-white dark:bg-gray-800 shadow-sm rounded-full px-3 py-2 sm:px-4 sm:py-2 transition-colors duration-200">
        {/* ロゴ */}
          <h1 className="font-normal lowercase text-xs sm:text-sm md:text-base text-gray-900 dark:text-gray-100 tracking-wide whitespace-nowrap">
          minimal gear manager
        </h1>

        {/* ボタングループ */}
          <div className="flex items-center gap-2 sm:gap-3">
          {onNavigateToComparison && (
            <button
                className="text-xs sm:text-sm px-2 py-1 sm:px-3 md:px-3 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 hover:-translate-y-0.5 transition-all duration-150"
              onClick={onNavigateToComparison}
            >
              compare
            </button>
          )}

          {onShowCategoryManager && (
            <button
                className="text-xs sm:text-sm px-2 py-1 sm:px-3 md:px-3 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 hover:-translate-y-0.5 transition-all duration-150"
              onClick={onShowCategoryManager}
            >
              categories
            </button>
          )}

          <button
              className="text-xs sm:text-sm px-2 py-1 sm:px-3 md:px-3 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 hover:-translate-y-0.5 transition-all duration-150"
            onClick={onToggleChat}
          >
            ai
          </button>

            {/* ダークモード切り替えボタン */}
            <button
              className="text-xs sm:text-sm p-1.5 sm:p-2 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 hover:-translate-y-0.5 transition-all duration-150"
              onClick={toggleDarkMode}
              aria-label="ダークモード切り替え"
              title={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {isDark ? (
                // 太陽アイコン（ライトモード）
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // 月アイコン（ダークモード）
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

          {isAuthenticated ? (
            <>
                <span className="hidden sm:inline text-xs lowercase text-gray-400 dark:text-gray-500 pl-1">
                {userName}
              </span>
              <button
                  className="text-xs sm:text-sm px-2 py-1 sm:px-3 md:px-3 bg-gray-700 dark:bg-gray-600 text-white rounded-full shadow-sm hover:bg-gray-800 dark:hover:bg-gray-500 hover:-translate-y-0.5 transition-all duration-150"
                onClick={onLogout}
              >
                logout
              </button>
            </>
          ) : (
            <button
                className="text-xs sm:text-sm px-2 py-1 sm:px-3 md:px-3 bg-gray-700 dark:bg-gray-600 text-white rounded-full shadow-sm hover:bg-gray-800 dark:hover:bg-gray-500 hover:-translate-y-0.5 transition-all duration-150"
              onClick={onShowLogin}
            >
              login
            </button>
          )}
        </div>
      </div>
    </div>
  </header>
  );
};

export default AppHeader;