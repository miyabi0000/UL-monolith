import React from 'react';
import { ViewMode } from '../utils/types';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="inline-flex rounded-lg p-1 bg-gray-100 dark:bg-gray-800">
      <button
        onClick={() => onViewChange('card')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          currentView === 'card'
            ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
            : 'text-gray-500 dark:text-gray-400'
        }`}
        aria-label="カードビュー"
      >
        Card
      </button>
      <button
        onClick={() => onViewChange('table')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          currentView === 'table'
            ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
            : 'text-gray-500 dark:text-gray-400'
        }`}
        aria-label="テーブルビュー"
      >
        Table
      </button>
    </div>
  );
};

export default ViewSwitcher;

