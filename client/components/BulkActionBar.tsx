import React from 'react';
import { COLORS } from '../utils/designSystem';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onClearSelection,
  onBulkDelete
}) => {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-md mb-4"
      style={{
        backgroundColor: `${COLORS.gray[100]}40`,
        border: `1px solid ${COLORS.gray[100]}`
      }}
    >
      {/* 左側: 選択情報 */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className="w-4 h-4 cursor-pointer"
            style={{ accentColor: COLORS.gray[700] }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: COLORS.text.primary }}
          >
            Select All
          </span>
        </label>

        <div
          className="text-sm font-semibold"
          style={{ color: COLORS.gray[700] }}
        >
          {selectedCount > 0 ? (
            <span>{selectedCount} selected</span>
          ) : (
            <span style={{ color: COLORS.text.secondary }}>
              Select items
            </span>
          )}
        </div>
      </div>

      {/* 右側: アクションボタン */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            <button
              onClick={onBulkDelete}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                backgroundColor: COLORS.accent.red,
                color: COLORS.white
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accent.red;
              }}
            >
              Delete ({selectedCount})
            </button>
            <button
              onClick={onClearSelection}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                backgroundColor: COLORS.white,
                color: COLORS.text.primary,
                border: `1px solid ${COLORS.gray[700]}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.gray[50];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.white;
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkActionBar;

