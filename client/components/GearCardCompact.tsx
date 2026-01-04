import React, { useState, useCallback } from 'react';
import { GearItemWithCalculated } from '../utils/types';
import { COLORS, getCategoryBadgeStyle, getPriorityColor } from '../utils/designSystem';
import { formatPrice } from '../utils/formatters';
import SeasonBar from './SeasonBar';

interface GearCardCompactProps {
  item: GearItemWithCalculated | null;
  viewMode: 'weight' | 'cost';
  onEdit?: (item: GearItemWithCalculated) => void;
  onDelete?: (id: string) => void;
}

const GearCardCompact: React.FC<GearCardCompactProps> = ({ item, viewMode, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-center p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select an item from the chart
        </p>
      </div>
    );
  }

  const imageUrl = item.imageUrl || 'https://via.placeholder.com/150x150?text=No+Image';
  const hasShortage = item.shortage > 0;

  // イベントハンドラをuseCallbackでmemo化
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && item && window.confirm(`「${item.name}」を削除しますか？`)) {
      onDelete(item.id);
    }
  }, [onDelete, item]);

  const handleOpenUrl = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (item?.productUrl) {
      window.open(item.productUrl, '_blank', 'noopener,noreferrer');
    }
  }, [item?.productUrl]);

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full w-full min-w-0">
      {/* 画像 */}
      <div
        className="relative w-full max-w-full max-h-[280px] aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onEdit?.(item)}
      >
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />

        {/* 不足警告（右上） */}
        {hasShortage && (
          <div className="absolute top-1.5 right-1.5 z-10">
            <span
              className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
              style={{
                backgroundColor: COLORS.warning,
                color: COLORS.white
              }}
              title={`${item.shortage}個不足`}
            >
              !
            </span>
          </div>
        )}

        {/* ホバーオーバーレイ */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-2"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 200ms ease-out'
          }}
        >
          {/* アクションボタン */}
          <div className="flex flex-col gap-1.5 w-full">
            <button
              className="action-button px-2 py-1 rounded text-xs font-medium transition-colors w-full"
              style={{
                backgroundColor: COLORS.gray[700],
                color: COLORS.white
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(item);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.gray[800];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.gray[700];
              }}
            >
              Edit
            </button>

            {item.productUrl && (
              <button
                className="action-button px-2 py-1 rounded text-xs font-medium transition-colors w-full"
                style={{
                  backgroundColor: COLORS.gray[700],
                  color: COLORS.white
                }}
                onClick={handleOpenUrl}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.gray[800];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.gray[700];
                }}
              >
                URL
              </button>
            )}

            {onDelete && (
              <button
                className="action-button px-2 py-1 rounded text-xs font-medium transition-colors w-full"
                style={{
                  backgroundColor: COLORS.danger,
                  color: COLORS.white
                }}
                onClick={handleDelete}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.danger;
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 名前とブランド */}
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 break-words overflow-wrap-anywhere leading-tight">
          {item.name}
        </h4>
        {item.brand && (
          <p className="text-xs text-gray-500 dark:text-gray-400 break-words overflow-wrap-anywhere opacity-75 leading-tight">
            {item.brand}
          </p>
        )}
      </div>

      {/* カテゴリ */}
      {item.category && (
        <div>
          <span
            className="inline-block text-xs font-semibold px-2 py-1 rounded"
            style={getCategoryBadgeStyle(item.category.color)}
          >
            {item.category.name}
          </span>
        </div>
      )}

      {/* 情報グリッド */}
      <div className="space-y-3 text-xs">
        {/* 重量 */}
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span>Weight</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {item.weightGrams}g
            {item.requiredQuantity > 1 && (
              <span className="text-gray-500 dark:text-gray-400 ml-1.5">
                (Total: {item.totalWeight}g)
              </span>
            )}
          </span>
        </div>

        {/* 価格 */}
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Price</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {formatPrice(item.priceCents)}
          </span>
        </div>

        {/* 所有数/必要数 */}
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Own/Need</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {item.ownedQuantity} / {item.requiredQuantity}
            {item.shortage > 0 && (
              <span className="text-red-600 dark:text-red-400 ml-1.5">
                (Short: {item.shortage})
              </span>
            )}
          </span>
        </div>

        {/* 優先度 */}
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>Priority</span>
          </div>
          <span
            className="font-semibold"
            style={{ color: getPriorityColor(item.priority) }}
          >
            P{item.priority}
          </span>
        </div>

        {/* シーズン */}
        {item.seasons && item.seasons.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Season</span>
            </div>
            <SeasonBar seasons={item.seasons} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(GearCardCompact);
