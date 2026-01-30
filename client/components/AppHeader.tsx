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
    <header className="bg-background transition-colors duration-150">
      {/* Wrapper with reduced padding */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-4 py-3">
        {/* Compact island container */}
        <div className="flex items-center justify-between gap-3 bg-card shadow-sm rounded-full px-4 py-2 sm:px-5 sm:py-2.5 border border-border transition-all duration-150">
          {/* Left: Logo */}
          <h1 className="font-medium lowercase text-sm sm:text-base text-foreground tracking-tight whitespace-nowrap">
            minimal gear manager
          </h1>

          {/* Right: Main actions */}
          <div className="flex items-center gap-2">
            {/* Hamburger menu for secondary actions */}
            <div className="relative menu-container">
              <button
                className="p-2 bg-secondary text-secondary-foreground rounded-full hover:bg-accent transition-all duration-150"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-popover rounded-xl shadow-xl border border-border py-1 z-50 animate-scale-in">
                  {onShowCategoryManager && (
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => {
                        onShowCategoryManager();
                        setMenuOpen(false);
                      }}
                    >
                      Categories
                    </button>
                  )}
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
              className="p-2 bg-secondary text-secondary-foreground rounded-full hover:bg-accent transition-all duration-150"
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
                className="p-2 bg-secondary text-secondary-foreground rounded-full hover:bg-accent transition-all duration-150"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-popover rounded-xl shadow-xl border border-border py-1 z-50 animate-scale-in">
                  {isAuthenticated ? (
                    <>
                      {userName && (
                        <div className="px-4 py-2.5 text-sm text-muted-foreground border-b border-border">
                          {userName}
                        </div>
                      )}
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
                      className="w-full text-left px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
