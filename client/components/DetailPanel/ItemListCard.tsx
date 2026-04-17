import React from 'react';
import { GearItemWithCalculated, QuantityDisplayMode } from '../../utils/types';
import { COLORS } from '../../utils/designSystem';
import TruncatedText from '../TruncatedText';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';
import { formatPrice } from '../../utils/formatters';
import { formatWeight } from '../../utils/weightUnit';
import { useWeightUnit } from '../../contexts/WeightUnitContext';

interface ItemListCardProps {
  item: GearItemWithCalculated;
  percentage: number;
  onClick: (itemId: string) => void;
  quantityDisplayMode: QuantityDisplayMode;
  viewMode: 'weight' | 'cost';
}

const ItemListCard: React.FC<ItemListCardProps> = ({ item, percentage, onClick, quantityDisplayMode, viewMode }) => {
  const { unit } = useWeightUnit();
  const imageUrl = item.imageUrl || 'https://via.placeholder.com/40x40?text=No+Image';
  const quantity = getQuantityForDisplayMode(item, quantityDisplayMode);
  const displayValue =
    viewMode === 'cost'
      ? formatPrice((item.priceCents || 0) * quantity)
      : formatWeight((item.weightGrams || 0) * quantity, unit);

  return (
    <button
      onClick={() => onClick(item.id)}
      className="w-full px-3 py-3 rounded shadow-sm
        hover:bg-gray-50 transition-colors text-left"
    >
      {/* グリッドレイアウト: 画像 | 名前+ブランド | 重量+メタ情報 | 不足インジケーター */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '48px minmax(150px, 1fr) 120px 24px' }}>
        {/* 画像 */}
        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>

        {/* 名前とブランド */}
        <div className="min-w-0 flex flex-col justify-center">
          <TruncatedText
            text={item.name}
            maxLength={30}
            className="text-xs font-medium text-gray-900 leading-tight"
          />
          {item.brand && (
            <div className="text-xs text-gray-500 mt-1 truncate leading-tight opacity-75">
              {item.brand}
            </div>
          )}
        </div>

        {/* 重量とメタ情報 - 固定幅120pxで右揃え */}
        <div className="text-right flex flex-col justify-center w-full">
          <div className="text-xs font-semibold text-gray-900 leading-tight whitespace-nowrap">
            {displayValue}
          </div>
          <div className="text-xs text-gray-500 mt-1 leading-tight whitespace-nowrap">
            <span className="font-medium">{percentage}%</span>
            <span className="ml-1.5">P{item.priority}</span>
          </div>
        </div>

        {/* 不足インジケーター - 固定幅24px */}
        <div className="flex items-center justify-center w-6">
          {item.shortage > 0 && (
            <span
              className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                backgroundColor: COLORS.warning,
                color: COLORS.white,
              }}
              title={`${item.shortage}個不足`}
            >
              !
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default React.memo(ItemListCard);
