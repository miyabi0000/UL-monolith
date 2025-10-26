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
  // 小判型ボタンのスタイル（ベース）
  const pillButtonStyle: React.CSSProperties = {
    backgroundColor: COLORS.white,
    color: COLORS.text.secondary,
    borderRadius: '999px', // 完全な小判型
    boxShadow: SHADOW,
    transition: 'all 150ms ease-out',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <header
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      {/* Wrapper with same structure as main */}
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-[16px]"
        style={{
          paddingTop: `${SPACING_SCALE.md}px`,
          paddingBottom: `${SPACING_SCALE.md}px`,
        }}
      >
        {/* アイランド型コンテナ */}
        <div
          className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-[23px]"
          style={{
            backgroundColor: COLORS.white,
            boxShadow: SHADOW,
            borderRadius: '999px', // 完全な小判型
            padding: `${SPACING_SCALE.sm}px ${SPACING_SCALE.md}px`,
          }}
        >
        {/* ロゴ */}
        <h1
          className="font-normal lowercase text-xs sm:text-sm md:text-base"
          style={{
            color: COLORS.text.primary,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          minimal gear manager
        </h1>

        {/* ボタングループ */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-[12px]">
          {onShowCategoryManager && (
            <button
              className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1 md:px-[12px] md:py-[4px]"
              onClick={onShowCategoryManager}
              style={pillButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.gray[50];
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.white;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              categories
            </button>
          )}

          <button
            className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1 md:px-[12px] md:py-[4px]"
            onClick={onToggleChat}
            style={pillButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.gray[50];
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.white;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ai
          </button>

          {isAuthenticated ? (
            <>
              <span
                className="hidden sm:inline text-xs lowercase"
                style={{
                  color: COLORS.text.muted,
                  paddingLeft: `${SPACING_SCALE.xs}px`,
                }}
              >
                {userName}
              </span>
              <button
                className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1 md:px-[12px] md:py-[4px]"
                onClick={onLogout}
                style={{
                  ...pillButtonStyle,
                  backgroundColor: COLORS.gray[700],
                  color: COLORS.white,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.gray[800];
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.gray[700];
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                logout
              </button>
            </>
          ) : (
            <button
              className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1 md:px-[12px] md:py-[4px]"
              onClick={onShowLogin}
              style={{
                ...pillButtonStyle,
                backgroundColor: COLORS.gray[700],
                color: COLORS.white,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.gray[800];
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.gray[700];
                e.currentTarget.style.transform = 'translateY(0)';
              }}
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