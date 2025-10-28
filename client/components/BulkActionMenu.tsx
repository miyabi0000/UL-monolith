import React from 'react';
import { COLORS } from '../utils/designSystem';

interface BulkActionMenuProps {
  showCheckboxes: boolean;
  onToggleCheckboxes: () => void;
}

const BulkActionMenu: React.FC<BulkActionMenuProps> = ({
  showCheckboxes,
  onToggleCheckboxes
}) => {
  return (
    <button
      onClick={onToggleCheckboxes}
      className={`p-2 rounded-md transition-colors text-gray-900 dark:text-gray-100 ${
        showCheckboxes
          ? 'bg-gray-100 dark:bg-gray-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      aria-label="一括編集"
      title="一括編集"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <circle cx="10" cy="4" r="1.5" />
        <circle cx="10" cy="10" r="1.5" />
        <circle cx="10" cy="16" r="1.5" />
      </svg>
    </button>
  );
};

export default BulkActionMenu;

