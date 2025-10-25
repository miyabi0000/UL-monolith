import React from 'react';
import { COLORS } from '../utils/designSystem';

type ViewMode = 'table' | 'card';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="inline-flex rounded-lg p-1" style={{ backgroundColor: COLORS.background }}>
      <button
        onClick={() => onViewChange('card')}
        className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
        style={{
          backgroundColor: currentView === 'card' ? COLORS.white : 'transparent',
          color: currentView === 'card' ? COLORS.primary.dark : COLORS.text.secondary,
          boxShadow: currentView === 'card' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
        }}
        aria-label="カードビュー"
      >
        🎴 Card
      </button>
      <button
        onClick={() => onViewChange('table')}
        className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
        style={{
          backgroundColor: currentView === 'table' ? COLORS.white : 'transparent',
          color: currentView === 'table' ? COLORS.primary.dark : COLORS.text.secondary,
          boxShadow: currentView === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
        }}
        aria-label="テーブルビュー"
      >
        📋 Table
      </button>
    </div>
  );
};

export default ViewSwitcher;

