import React from 'react';
import { COLORS, FONT_SCALE, SPACING_SCALE, SHADOW } from '../utils/designSystem';

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
  return (
    <header
      style={{
        backgroundColor: COLORS.white,
        boxShadow: SHADOW,
      }}
    >
      <div
        className="max-w-7xl mx-auto flex items-center justify-between"
        style={{
          padding: `${SPACING_SCALE.md}px ${SPACING_SCALE.lg}px`,
        }}
      >
        <h1
          className="font-semibold"
          style={{
            color: COLORS.text.primary,
            fontSize: `${FONT_SCALE.lg}px`,
          }}
        >
          UL GEAR
        </h1>

        <div className="flex items-center" style={{ gap: `${SPACING_SCALE.lg}px` }}>
          {onShowCategoryManager && (
            <button
              onClick={onShowCategoryManager}
              className="text-sm hover:opacity-70 transition-opacity"
              style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.base}px` }}
            >
              Categories
            </button>
          )}

          <button
            onClick={onToggleChat}
            className="text-sm hover:opacity-70 transition-opacity"
            style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.base}px` }}
          >
            AI
          </button>

          {isAuthenticated ? (
            <>
              <span
                className="text-sm"
                style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.base}px` }}
              >
                {userName}
              </span>
              <button
                onClick={onLogout}
                className="text-sm hover:opacity-70 transition-opacity"
                style={{ color: COLORS.gray[700], fontSize: `${FONT_SCALE.base}px` }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={onShowLogin}
              className="text-sm hover:opacity-70 transition-opacity"
              style={{ color: COLORS.gray[700], fontSize: `${FONT_SCALE.base}px` }}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;