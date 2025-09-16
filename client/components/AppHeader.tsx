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
    <div 
      className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: 'rgba(247, 252, 252, 0.8)', // COLORS.background with transparency
        backdropFilter: 'blur(10px)',
        border: `1px solid ${COLORS.primary.light}`
      }}
    >
      <div className="flex items-center gap-4">
        <h1 
          className="text-2xl font-bold"
          style={{ color: COLORS.primary.dark }}
        >
          UL GEAR
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* AI Button */}
        <button
          onClick={onToggleChat}
          className="w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: COLORS.primary.dark,
            color: COLORS.white,
            border: `1px solid ${COLORS.primary.medium}`
          }}
        >
          AI
        </button>

        
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