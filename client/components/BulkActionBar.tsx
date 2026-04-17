import React from 'react';
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
  canCompare?: boolean;
  compareDisabledReason?: string;
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
  maxCompareItems = 3,
  canCompare: canCompareFromProps,
  compareDisabledReason,
}) => {
  // 比較ボタンの有効状態判定
  // - canCompareFromProps が渡されている場合はそれを優先（バリデーション済み）
  // - 渡されていない場合は選択数だけで判定（後方互換性）
  const canCompare = canCompareFromProps !== undefined
    ? canCompareFromProps
    : selectedCount >= 2 && selectedCount <= maxCompareItems;

  // 選択数のプログレス（比較モード時のみ）
  const selectionProgress = isCompareMode && selectedCount > 0
    ? Math.min((selectedCount / maxCompareItems) * 100, 100)
    : 0;

  return (
    <>
      {/* エラーバナー（比較モード時、選択あり、比較不可の場合） */}
      {isCompareMode && selectedCount > 0 && !canCompare && compareDisabledReason && (
        <div className="px-4 py-2 mb-2 rounded-md bg-gray-100 shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs text-gray-700 font-medium">
            {compareDisabledReason}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 rounded-md mb-4 bg-gray-100/25 shadow-sm">
      {/* 左側: 選択情報 */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-gray-700"
          />
          <span className="text-sm font-medium text-gray-900">
            Select All
          </span>
        </label>

        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-gray-700">
            {selectedCount > 0 ? (
              <span>
                {selectedCount} selected
                {isCompareMode && (
                  <span className="text-gray-500 ml-1">
                    / {maxCompareItems} max
                  </span>
                )}
              </span>
            ) : (
              <span className="text-gray-500">
                Select items
              </span>
            )}
          </div>

          {/* プログレスバー（比較モード時のみ） */}
          {isCompareMode && selectedCount > 0 && (
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  canCompare
                    ? 'bg-gray-700'
                    : 'bg-gray-400'
                }`}
                style={{ width: `${selectionProgress}%` }}
              />
            </div>
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
                    ? 'bg-gray-700 hover:bg-gray-800 text-white shadow-sm'
                    : 'bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed'
                }`}
                title={!canCompare && compareDisabledReason ? compareDisabledReason : `Compare ${selectedCount}/${maxCompareItems} items`}
                aria-label={`Compare (${selectedCount}/${maxCompareItems} items selected)`}
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
    </>
  );
};

export default BulkActionBar;
