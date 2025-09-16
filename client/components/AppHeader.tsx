import React from 'react';
import { COLORS, inlineStyles } from '../utils/colors';

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
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <h1 
          className="text-2xl font-bold"
          style={{ color: COLORS.primary.dark }}
        >
          UL GEAR
        </h1>
      </div>
      
      {/* Chat Button - Fixed Right */}
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={onToggleChat}
          className="w-12 h-12 rounded-full text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
          style={{
            backgroundColor: COLORS.primary.dark,
            color: COLORS.white,
            border: `2px solid ${COLORS.primary.medium}`
          }}
        >
          AI
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span 
              className="text-xs font-medium"
              style={{ color: COLORS.text.secondary }}
            >
              {userName}
            </span>
            <button
              onClick={onLogout}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={inlineStyles.secondaryButton}
            >
              LOGOUT
            </button>
          </div>
        ) : (
          <button
            onClick={onShowLogin}
            className="px-3 py-1 rounded text-xs font-medium transition-colors"
            style={inlineStyles.secondaryButton}
          >
            LOGIN
          </button>
        )}
      </div>
    </div>
  );
};

export default AppHeader;