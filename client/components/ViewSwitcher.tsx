import React from 'react';
import { ViewMode } from '../utils/types';
import CardIcon from './icons/CardIcon';
import TableIcon from './icons/TableIcon';

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
        title="Card"
      >
        <CardIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange('table')}
        aria-pressed={currentView === 'table'}
        aria-label="テーブルビュー"
        title="Table"
      >
        <TableIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewSwitcher;
