import React, { useState } from 'react';
import { GearItemWithCalculated } from '../utils/types';
import { COLORS, RADIUS_SCALE, getCategoryBadgeStyle } from '../utils/designSystem';

interface GearCardProps {
  item: GearItemWithCalculated;
  onEdit: (item: GearItemWithCalculated) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  showCheckbox?: boolean;
}

const formatPrice = (priceCents?: number) => {
  if (!priceCents) return '-';
  const price = priceCents / 100;
  if (price > 1000) {
    return `¥${Math.round(price).toLocaleString()}`;
  } else {
    return `$${price.toFixed(2)}`;
  }
};

const GearCard: React.FC<GearCardProps> = ({
  item,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  showCheckbox = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const hasShortage = item.shortage > 0;
  const imageUrl = item.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image';

  const handleCardClick = (e: React.MouseEvent) => {
    // アクションボタンがクリックされた場合は除外
    if ((e.target as HTMLElement).closest('.action-button')) {
      return;
    }
    onEdit(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`「${item.name}」を削除しますか？`)) {
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
    <div
      className="relative group cursor-pointer overflow-hidden"
      style={{
        borderRadius: `${RADIUS_SCALE.md}px`,
        backgroundColor: COLORS.white,
        boxShadow: isHovered 
          ? '0 10px 25px rgba(0,0,0,0.15)' 
          : '0 1px 3px rgba(0,0,0,0.1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 200ms ease-out',
        aspectRatio: '1 / 1'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* チェックボックス（チェックボックスモード時） */}
      {showCheckbox && (
        <div
          className="absolute top-2 left-2 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(item.id)}
            className="w-5 h-5 cursor-pointer"
            style={{ accentColor: COLORS.gray[700] }}
          />
        </div>
      )}

      {/* カテゴリバッジ（左上） */}
      {item.category && (
        <div
          className="absolute top-2 z-10"
          style={{ left: showCheckbox ? '36px' : '8px' }}
        >
          <span
            className="text-xs font-semibold px-2 py-1 rounded"
            style={getCategoryBadgeStyle(item.category.color)}
          >
            {item.category.name}
          </span>
        </div>
      )}

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

      {/* 画像 */}
      <img
        src={imageUrl}
        alt={item.name}
        loading="lazy"
        className="w-full h-full object-cover"
      />

      {/* ホバーオーバーレイ */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center p-4"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 200ms ease-out'
        }}
      >
        {/* 詳細情報（小さく表示） */}
        <div className="text-center mb-4">
          <h3
            className="text-sm font-bold mb-1"
            style={{ color: COLORS.white }}
          >
            {item.name}
          </h3>
          {item.brand && (
            <p
              className="text-xs mb-1"
              style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              {item.brand}
            </p>
          )}
          <p
            className="text-xs"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            {formatPrice(item.priceCents)}
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <button
            className="action-button px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: COLORS.gray[700],
              color: COLORS.white
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.gray[800];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.gray[700];
            }}
          >
            編集
          </button>
          
          {item.productUrl && (
            <button
              className="action-button px-3 py-1.5 rounded text-xs font-medium transition-colors"
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
          
          <button
            className="action-button px-3 py-1.5 rounded text-xs font-medium transition-colors"
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
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(GearCard);

