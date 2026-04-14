import React from 'react';
import { ViewMode } from '../utils/types';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="segmented" role="tablist">
      <button
        onClick={() => onViewChange('card')}
        aria-pressed={currentView === 'card'}
        aria-label="カードビュー"
      >
        Card
      </button>
      <button
        onClick={() => onViewChange('table')}
        aria-pressed={currentView === 'table'}
        aria-label="テーブルビュー"
      >
        Table
      </button>
    </div>
  );
};

export default ViewSwitcher;
