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
      className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded transition-all duration-300 hover:shadow-md"
      style={{
        backgroundColor: 'rgba(247, 252, 252, 0.85)', // Optimized transparency for readability
        backdropFilter: 'blur(8px) saturate(1.1)', // Standard glass effect
        border: `1px solid ${COLORS.primary.light}`,
        WebkitBackdropFilter: 'blur(8px) saturate(1.1)' // Safari support
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