import React from 'react';
import { COLORS, inlineStyles } from '../utils/colors';
import { getSquareSeparatorStyle, getLiquidGlassStyle } from '../utils/colorHelpers';

interface AppHeaderProps {
  onShowLogin: () => void;
  onLogout: () => void;
  onToggleChat: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onShowLogin,
  onLogout,
  onToggleChat,
  isAuthenticated,
  userName
}) => {
  return (
    <header
      className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 transition-all duration-300 hover:shadow-lg backdrop-blur-sm"
      style={getSquareSeparatorStyle()}
    >
      <div className="flex items-center gap-3">
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: COLORS.primary.dark }}
        >
          UL GEAR
        </h1>
        <div
          className="hidden sm:block h-4 w-px"
          style={{ backgroundColor: COLORS.primary.light }}
        />
        <span
          className="hidden sm:inline text-xs font-medium"
          style={{ color: COLORS.text.secondary }}
        >
          Ultra Light Gear Manager
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* AI Button - Enhanced with tooltip */}
        <div className="relative group">
          <button
            onClick={onToggleChat}
            className="w-8 h-8 rounded-lg text-xs font-bold transition-all duration-300 hover:scale-105 hover:rotate-3 relative overflow-hidden shadow-md"
            style={getLiquidGlassStyle()}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, getLiquidGlassStyle('hover'));
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, getLiquidGlassStyle());
            }}
            onMouseDown={(e) => {
              Object.assign(e.currentTarget.style, getLiquidGlassStyle('active'));
            }}
            onMouseUp={(e) => {
              Object.assign(e.currentTarget.style, getLiquidGlassStyle('hover'));
            }}
          >
            <span style={{ color: COLORS.primary.dark, fontWeight: 'bold' }}>AI</span>
          </button>
          <div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
            style={{
              backgroundColor: COLORS.primary.dark,
              color: COLORS.white
            }}
          >
            AI Assistant
          </div>
        </div>

        
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: COLORS.primary.medium,
                  color: COLORS.white
                }}
              >
                {userName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span
                className="text-sm font-medium hidden sm:inline"
                style={{ color: COLORS.text.primary }}
              >
                {userName}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 hover:scale-105"
              style={inlineStyles.secondaryButton}
            >
              LOGOUT
            </button>
          </div>
        ) : (
          <button
            onClick={onShowLogin}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 hover:scale-105"
            style={inlineStyles.secondaryButton}
          >
            LOGIN
          </button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;