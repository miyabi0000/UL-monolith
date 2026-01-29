import React, { useState } from 'react';
import { GearItemWithCalculated } from '../utils/types';
import { COLORS, getCategoryBadgeStyle, getPriorityColor } from '../utils/designSystem';
import SeasonBar from './SeasonBar';

interface GearCardCompactProps {
  item: GearItemWithCalculated | null;
  viewMode: 'weight' | 'cost';
  onEdit?: (item: GearItemWithCalculated) => void;
  onDelete?: (id: string) => void;
}

const formatPrice = (priceCents?: number) => {
  if (!priceCents) return '-';
  const price = priceCents / 100;
  return `¥${Math.round(price).toLocaleString()}`;
};

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm(`「${item.name}」を削除しますか？`)) {
      onDelete(item.id);
    }
  };

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.productUrl) {
      window.open(item.productUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full">
      {/* 画像 */}
      <div
        className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onEdit?.(item)}
      >
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* 不足警告（右上） */}
        {hasShortage && (
          <div className="absolute top-2 right-2 z-10">
            <span
              className="text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full"
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
          className="absolute inset-0 flex flex-col items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 200ms ease-out'
          }}
        >
          {/* アクションボタン */}
          <div className="flex flex-col gap-2 w-full">
            <button
              className="action-button px-3 py-1.5 rounded text-xs font-medium transition-colors w-full"
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
                className="action-button px-3 py-1.5 rounded text-xs font-medium transition-colors w-full"
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
                className="action-button px-3 py-1.5 rounded text-xs font-medium transition-colors w-full"
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
      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 break-words">
          {item.name}
        </h4>
        {item.brand && (
          <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
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
      <div className="space-y-2 text-xs">
        {/* 重量 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Weight:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {item.weightGrams}g
            {item.requiredQuantity > 1 && (
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                (Total: {item.totalWeight}g)
              </span>
            )}
          </span>
        </div>

        {/* 価格 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Price:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {formatPrice(item.priceCents)}
          </span>
        </div>

        {/* 所有数/必要数 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Own/Need:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {item.ownedQuantity} / {item.requiredQuantity}
            {item.shortage > 0 && (
              <span className="text-red-600 dark:text-red-400 ml-1">
                (Short: {item.shortage})
              </span>
            )}
          </span>
        </div>

        {/* 優先度 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Priority:</span>
          <span
            className="font-semibold"
            style={{ color: getPriorityColor(item.priority) }}
          >
            {item.priority}
          </span>
        </div>

        {/* シーズン */}
        {item.seasons && item.seasons.length > 0 && (
          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Season:</div>
            <SeasonBar seasons={item.seasons} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(GearCardCompact);
