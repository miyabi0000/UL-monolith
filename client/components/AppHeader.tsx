import React from 'react';
import { COLORS, inlineStyles } from '../utils/colors';

interface AppHeaderProps {
  onShowForm: () => void;
  onShowCategoryManager: () => void;
  onShowLogin: () => void;
  onLogout: () => void;
  onToggleChat: () => void;
  onToggleDropdown: () => void;
  onToggleCheckboxes: () => void;
  showGearDropdown: boolean;
  showCheckboxes: boolean;
  isAuthenticated: boolean;
  userName?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onShowForm,
  onShowCategoryManager,
  onShowLogin,
  onLogout,
  onToggleChat,
  onToggleDropdown,
  onToggleCheckboxes,
  showGearDropdown,
  showCheckboxes,
  isAuthenticated,
  userName
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <h1 
          className="text-3xl font-bold"
          style={{ color: COLORS.primary.dark }}
        >
          UL Gear Manager
        </h1>
        <button
          onClick={onToggleChat}
          className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
          style={{
            ...inlineStyles.secondaryButton,
            ':hover': { backgroundColor: COLORS.primary.light }
          }}
        >
          💬 Chat
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            onClick={onToggleDropdown}
            className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
            style={inlineStyles.primaryButton}
          >
            ⚙️ ギア管理
            <span className={`transform transition-transform ${showGearDropdown ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {showGearDropdown && (
            <div 
              className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50"
              style={{
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.primary.medium}`
              }}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    onShowForm();
                    onToggleDropdown();
                  }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-80"
                  style={{
                    color: COLORS.text.primary,
                    ':hover': { backgroundColor: COLORS.primary.light }
                  }}
                >
                  + ギアを追加
                </button>
                <button
                  onClick={() => {
                    onShowCategoryManager();
                    onToggleDropdown();
                  }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-80"
                  style={{
                    color: COLORS.text.primary,
                    ':hover': { backgroundColor: COLORS.primary.light }
                  }}
                >
                  📁 カテゴリ管理
                </button>
                <button
                  onClick={() => {
                    onToggleCheckboxes();
                    onToggleDropdown();
                  }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-80"
                  style={{
                    color: COLORS.text.primary,
                    ':hover': { backgroundColor: COLORS.primary.light }
                  }}
                >
                  {showCheckboxes ? '☑️ 選択モード終了' : '☐ 選択モード'}
                </button>
              </div>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span 
              className="text-sm"
              style={{ color: COLORS.text.secondary }}
            >
              こんにちは、{userName}さん
            </span>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={inlineStyles.secondaryButton}
            >
              ログアウト
            </button>
          </div>
        ) : (
          <button
            onClick={onShowLogin}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={inlineStyles.secondaryButton}
          >
            ログイン
          </button>
        )}
      </div>
    </div>
  );
};

export default AppHeader;