import React from 'react';

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
      className={`p-2 rounded-md transition-colors text-gray-900 ${
        showCheckboxes
          ? 'bg-gray-100'
          : 'hover:bg-gray-50'
      }`}
      aria-label="一括編集"
      title="一括編集"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l5 5-9 9H3v-5l9-9z" />
        <path d="M12 3l2 2" />
      </svg>
    </button>
  );
};

export default BulkActionMenu;
