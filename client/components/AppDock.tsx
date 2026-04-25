import React, { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useOutsideClick } from '../hooks/useOutsideClick';

interface AppDockProps {
  onLogout: () => void;
  isAuthenticated: boolean;
  userName?: string;
  onShowChat?: () => void;
}

/**
 * AppDock — `/p/:packId` (公開 pack) 等 ProfileHeader が無いルート専用の
 * 右上固定チップ群。Board 戻り線 / Chat / User メニューを載せる。
 *
 * ダークモード切替は `ThemeToggleFab` (App.tsx で全ルート常駐) に一元化済み
 * のため、ここでは扱わない。
 */
const AppDock: React.FC<AppDockProps> = ({
  onLogout,
  isAuthenticated,
  userName,
  onShowChat,
}) => {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  useOutsideClick(dockRef, () => setUserMenuOpen(false), userMenuOpen);

  const userInitial = (userName?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="fixed top-3 right-3 z-[70] pointer-events-none">
      <div
        ref={dockRef}
        className="pointer-events-auto relative flex items-center gap-1 px-1.5 py-1.5 rounded-surface has-noise"
        style={{ background: 'var(--surface-level-0)', boxShadow: 'var(--shadow-sm)', border: 'var(--border-default)' }}
      >
        {location.pathname.startsWith('/p/') && (
          <a
            href="/"
            className="h-control-lg sm:h-control px-2.5 sm:px-3 rounded-control text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            style={{ color: 'var(--ink-secondary)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface-level-1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
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
            className="glass-header-chip h-control-lg sm:h-control px-2.5 sm:px-3 inline-flex items-center justify-center gap-1.5 text-xs font-medium"
            style={{ color: 'var(--ink-secondary)' }}
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

        {/* ユーザーメニュー（モバイルでは ProfileHeader に統合済みのため非表示）
         * 未認証時は Landing 画面を表示するため、AppDock は常に認証済み前提。
         * デスクトップ幅でのみ avatar → dropdown (userName + Logout) を表示。 */}
        {isAuthenticated && (
          <div className="hidden sm:block relative">
            <button
              type="button"
              className="glass-header-chip h-control min-w-control px-1.5 inline-flex items-center justify-center"
              style={{ color: 'var(--ink-secondary)' }}
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-label="User menu"
              title={userName || 'User'}
            >
              <span
                className="h-6 w-6 rounded-full text-2xs font-semibold inline-flex items-center justify-center"
                style={{ background: 'var(--mondrian-black)', color: 'var(--ink-inverse)' }}
              >
                {userInitial}
              </span>
            </button>

            {userMenuOpen && (
              <div
                className="card absolute right-0 top-full mt-2 w-44 overflow-hidden"
                style={{ borderRadius: 'var(--radius-control)', boxShadow: 'var(--shadow-md)' }}
              >
                {userName && (
                  <div
                    className="px-3 py-2 text-xs truncate"
                    style={{ color: 'var(--ink-muted)', borderBottom: 'var(--border-divider)' }}
                  >
                    {userName}
                  </div>
                )}
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs transition-colors"
                  style={{ color: 'var(--ink-primary)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-level-1)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
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
