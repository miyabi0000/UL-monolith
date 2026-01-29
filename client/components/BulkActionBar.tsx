import React from 'react';
import { COLORS } from '../utils/designSystem';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkUpdate?: () => void;
  onCompare?: () => void;
  isCompareMode?: boolean;
  maxCompareItems?: number;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkUpdate,
  onCompare,
  isCompareMode = false,
  maxCompareItems = 3
}) => {
  // 比較ボタンの有効状態判定（2〜3件で有効）
  const canCompare = selectedCount >= 2 && selectedCount <= maxCompareItems;
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-md mb-4 bg-gray-100/25 dark:bg-gray-800/25 border border-gray-200 dark:border-gray-700">
      {/* 左側: 選択情報 */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-gray-700 dark:accent-gray-500"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Select All
          </span>
        </label>

        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {selectedCount > 0 ? (
            <span>{selectedCount} selected</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              Select items
            </span>
          )}
        </div>
      </div>

      {/* 右側: アクションボタン */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            {isCompareMode && onCompare && (
              <button
                onClick={onCompare}
                disabled={!canCompare}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  canCompare
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 opacity-50 cursor-not-allowed'
                }`}
                aria-label={`比較する（${selectedCount}/${maxCompareItems}件選択中）`}
              >
                Compare ({selectedCount}/{maxCompareItems})
              </button>
            )}
            {!isCompareMode && onBulkUpdate && (
              <button
                onClick={onBulkUpdate}
                className="btn-primary btn-xs px-3"
              >
                Bulk Update ({selectedCount})
              </button>
            )}
            {!isCompareMode && (
              <button
                onClick={onBulkDelete}
                className="btn-danger btn-xs px-3"
              >
                Delete ({selectedCount})
              </button>
            )}
            <button
              onClick={onClearSelection}
              className="btn-secondary btn-xs px-3"
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
